#!/usr/bin/env node

/**
 * rewrite-authors.js
 *
 * A tool to audit and rewrite commit author/committer identities in a Git repo
 * using git-filter-repo.
 *
 * Workflow:
 *   1. node rewrite-authors.js scan      — writes commits.json + mailmap.json
 *   2. Edit commits.json  (set "committer": 2 or 3 on any commit you want reassigned)
 *   3. Edit mailmap.json  (fill in name/email for entries 2 and 3)
 *   4. node rewrite-authors.js dry-run   — preview how many commits will change
 *   5. node rewrite-authors.js rewrite   — rewrite history with git-filter-repo
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const COMMITS_FILE = "commits.json";
const MAILMAP_FILE = "mailmap.json";

// ── Helpers ───────────────────────────────────────────────────────────────────
function git(args, opts = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  });
  if (result.status !== 0) {
    console.error(`git ${args.join(" ")} failed:\n${result.stderr}`);
    process.exit(1);
  }
  return result.stdout.trim();
}

function checkGitFilterRepo() {
  const result = spawnSync("git", ["filter-repo", "--version"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    console.error(
      "❌  git-filter-repo is not installed or not on PATH.\n" +
        "    Install it with:  pip install git-filter-repo\n" +
        "    Docs: https://github.com/newren/git-filter-repo",
    );
    process.exit(1);
  }
}

function loadJSON(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function currentIdentity() {
  const name = git(["config", "user.name"]);
  const email = git(["config", "user.email"]);
  return { name, email };
}

// ── Commands ──────────────────────────────────────────────────────────────────

/**
 * scan — read all commits and produce commits.json + mailmap.json
 */
function scan() {
  console.log("🔍  Scanning commits …");

  // %H = hash, %an = author name, %ae = author email, %s = subject
  const sep = "\x1f"; // unit separator (safe delimiter)
  const raw = git([
    "log",
    "--all",
    "--reverse",
    `--format=%H${sep}%an${sep}%ae${sep}%s`,
  ]);

  if (!raw) {
    console.error("No commits found.");
    process.exit(1);
  }

  const self = currentIdentity();

  // Build a lookup: "name\x1femail" → slot index (1-based)
  const slotMap = new Map();
  slotMap.set(`${self.name}${sep}${self.email}`, 1);
  let nextSlot = 2;

  const mailmap = loadJSON(MAILMAP_FILE) || {
    1: { name: self.name, email: self.email },
    2: { name: "", email: "" },
    3: { name: "", email: "" },
  };

  // If mailmap already has slot-2 / slot-3 filled, register them so scan is
  // idempotent on subsequent runs.
  for (const slot of ["2", "3"]) {
    const entry = mailmap[slot];
    if (entry && entry.name && entry.email) {
      slotMap.set(`${entry.name}${sep}${entry.email}`, Number(slot));
    }
  }

  // Load existing commits so user edits aren't blown away on re-scan.
  const existing = loadJSON(COMMITS_FILE);
  const existingByHash = {};
  if (existing) {
    for (const c of existing) existingByHash[c.hash] = c;
  }

  const commits = [];

  for (const line of raw.split("\n")) {
    const [hash, authorName, authorEmail, ...titleParts] = line.split(sep);
    const title = titleParts.join(sep); // title may contain sep chars

    const key = `${authorName}${sep}${authorEmail}`;
    if (!slotMap.has(key)) {
      // Assign a new slot
      if (nextSlot > 3) {
        // More than 3 unique identities — still track them but warn.
        console.warn(
          `⚠️  More than 3 unique identities detected. ` +
            `Commit ${hash.slice(0, 8)} (${authorName} <${authorEmail}>) ` +
            `will keep slot 1 until you extend the mailmap.`,
        );
        slotMap.set(key, 1);
      } else {
        slotMap.set(key, nextSlot);
        if (!mailmap[String(nextSlot)] || !mailmap[String(nextSlot)].name) {
          mailmap[String(nextSlot)] = { name: authorName, email: authorEmail };
        }
        nextSlot++;
      }
    }

    const defaultSlot = slotMap.get(key);

    // Preserve any existing committer override the user already set.
    const preserved = existingByHash[hash];
    const committer =
      preserved && typeof preserved.committer === "number"
        ? preserved.committer
        : defaultSlot;

    commits.push({
      hash,
      title,
      originalAuthor: { name: authorName, email: authorEmail },
      committer, // 1 = you, 2 = person 2, 3 = person 3
    });
  }

  writeJSON(COMMITS_FILE, commits);
  writeJSON(MAILMAP_FILE, mailmap);

  console.log(`✅  Wrote ${commits.length} commits → ${COMMITS_FILE}`);
  console.log(`✅  Wrote identity map          → ${MAILMAP_FILE}`);
  console.log();
  console.log(
    "Next steps:\n" +
      `  1. Edit ${MAILMAP_FILE}  — fill in name/email for slots 2 and 3\n` +
      `  2. Edit ${COMMITS_FILE} — set "committer" to 2 or 3 on any commit\n` +
      `  3. node rewrite-authors.js dry-run\n` +
      `  4. node rewrite-authors.js rewrite`,
  );
}

/**
 * dry-run — show how many commits would be rewritten, with a preview table
 */
function dryRun() {
  const commits = loadJSON(COMMITS_FILE);
  const mailmap = loadJSON(MAILMAP_FILE);

  if (!commits || !mailmap) {
    console.error(
      `❌  Run 'scan' first to generate ${COMMITS_FILE} and ${MAILMAP_FILE}.`,
    );
    process.exit(1);
  }

  const self = currentIdentity();

  let changeCount = 0;
  const changes = [];

  for (const commit of commits) {
    const target = mailmap[String(commit.committer)];
    if (!target) {
      console.error(
        `❌  No mailmap entry for slot ${commit.committer} (commit ${commit.hash.slice(0, 8)})`,
      );
      process.exit(1);
    }

    const same =
      commit.originalAuthor.name === target.name &&
      commit.originalAuthor.email === target.email;

    if (!same) {
      changeCount++;
      changes.push({
        hash: commit.hash.slice(0, 8),
        title: commit.title.slice(0, 50),
        from: `${commit.originalAuthor.name} <${commit.originalAuthor.email}>`,
        to: `${target.name} <${target.email}>`,
      });
    }
  }

  console.log(`\n📊  Dry-run results`);
  console.log(`    Total commits : ${commits.length}`);
  console.log(`    Will change   : ${changeCount}`);
  console.log(`    Unchanged     : ${commits.length - changeCount}\n`);

  if (changes.length) {
    console.log("Changes preview:\n");
    const hashW = 8,
      titleW = 52,
      fromW = 40,
      toW = 40;
    const header =
      "Hash".padEnd(hashW) +
      "  " +
      "Title".padEnd(titleW) +
      "  " +
      "From".padEnd(fromW) +
      "  " +
      "To".padEnd(toW);
    console.log(header);
    console.log("─".repeat(header.length));
    for (const c of changes) {
      console.log(
        c.hash.padEnd(hashW) +
          "  " +
          c.title.padEnd(titleW) +
          "  " +
          c.from.padEnd(fromW) +
          "  " +
          c.to.padEnd(toW),
      );
    }
  }
}

/**
 * rewrite — generate a per-commit callback script for git-filter-repo.
 *
 * WHY NOT --mailmap:
 *   git-filter-repo's --mailmap rewrites every commit that matches an old
 *   identity, globally. That means if you want to reassign only *some* of
 *   your own commits to another person, it would reassign ALL of them.
 *   Instead we generate a Python --commit-callback that maps each individual
 *   commit hash to its exact target identity, so the assignment is 1-to-1.
 */
function rewrite() {
  checkGitFilterRepo();

  const commits = loadJSON(COMMITS_FILE);
  const mailmap = loadJSON(MAILMAP_FILE);

  if (!commits || !mailmap) {
    console.error(`❌  Run 'scan' first.`);
    process.exit(1);
  }

  // Validate mailmap completeness
  for (const slot of ["1", "2", "3"]) {
    const e = mailmap[slot];
    if (!e || !e.name || !e.email) {
      console.error(
        `❌  mailmap.json slot ${slot} is incomplete (missing name or email).`,
      );
      process.exit(1);
    }
  }

  // Build a dict of  hash → { name, email }  only for commits that need changing.
  const overrides = {}; // hash (full) → { name, email }
  let changeCount = 0;

  for (const commit of commits) {
    const target = mailmap[String(commit.committer)];
    const original = commit.originalAuthor;

    const same =
      original.name === target.name && original.email === target.email;

    if (!same) {
      overrides[commit.hash] = { name: target.name, email: target.email };
      changeCount++;
    }
  }

  if (changeCount === 0) {
    console.log("✅  Nothing to rewrite — all committer fields already match.");
    return;
  }

  // --commit-callback expects its value to be the *body* of a function
  // that git-filter-repo calls for every commit, with `commit` in scope.
  //
  // IMPORTANT: Do NOT wrap code in a `def` block and do NOT use exec() to
  // load a .py file. Both approaches silently scope away the logic so
  // git-filter-repo never sees it, and every commit passes through unchanged
  // (or gets mangled by a stale --mailmap). Inline the statements directly.
  const dictEntries = Object.entries(overrides)
    .map(([hash, id]) => {
      const name = id.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const email = id.email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `  b'${hash}': (b'${name}', b'${email}'),`;
    })
    .join("\n");

  const callbackBody = [
    "overrides = {",
    dictEntries,
    "}",
    "entry = overrides.get(commit.original_id)",
    "if entry:",
    "  name, email = entry",
    "  commit.author_name     = name",
    "  commit.author_email    = email",
    "  commit.committer_name  = name",
    "  commit.committer_email = email",
  ].join("\n");

  console.log(
    `\n🔧  Rewriting ${changeCount} commit(s) with per-commit callback …`,
  );
  console.log("    This will modify your local repository.\n");

  const result = spawnSync(
    "git",
    ["filter-repo", "--commit-callback", callbackBody, "--force"],
    { stdio: "inherit", encoding: "utf8" },
  );

  if (result.status !== 0) {
    console.error("❌  git-filter-repo exited with an error.");
    process.exit(1);
  }

  console.log("\n✅  History rewritten successfully.");
  console.log(
    "\n⚠️  Force-push required:\n" +
      "    git push origin --force --all\n" +
      "    git push origin --force --tags\n\n" +
      "    All collaborators must re-clone or hard-reset their branches.",
  );

  // After rewriting, re-scan so hashes are current
  console.log("\n🔄  Re-scanning to update commits.json with new hashes …");
  scan();
}

// ── CLI entry ─────────────────────────────────────────────────────────────────
const command = process.argv[2];

switch (command) {
  case "scan":
    scan();
    break;
  case "dry-run":
    dryRun();
    break;
  case "rewrite":
    rewrite();
    break;
  default:
    console.log(
      `Usage:\n` +
        `  node rewrite-authors.js scan      — scan commits → commits.json + mailmap.json\n` +
        `  node rewrite-authors.js dry-run   — preview changes without touching git\n` +
        `  node rewrite-authors.js rewrite   — rewrite history with git-filter-repo\n`,
    );
}
