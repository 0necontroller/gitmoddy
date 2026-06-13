import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Commit, Identity } from "../types";
import Button from "./ui/button";
import { cn } from "../lib/cn";
import { parseGitDate } from "../lib/date";
import { useAppContext } from "../context/AppContext";
import Avatar from "./Avatar";
import { GetCommitDetail } from "../../bindings/changeme/git/service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parsedDate = parseGitDate(dateStr);
    const diff = Date.now() - parsedDate.getTime();
    if (isNaN(diff)) return "";
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 30) return `${d}d ago`;
    return parsedDate.toLocaleDateString();
  } catch {
    return "";
  }
}

// ── Commit popover (renders fixed, to the right of the sidebar) ───────────────
interface PopoverData {
  commit: Commit;
  top: number;
  left: number;
}

function CommitPopover({
  data,
  mailmap,
  repoPath,
}: {
  data: PopoverData;
  mailmap: Record<number, Identity>;
  repoPath: string;
}) {
  const { commit, top, left } = data;
  const author = mailmap[commit.committer] ?? commit.originalAuthor;

  const [stats, setStats] = useState<{
    filesChanged: number;
    insertions: number;
    deletions: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setStats(null);
    GetCommitDetail(repoPath, commit.hash)
      .then((detail: any) => {
        if (active && detail) {
          setStats({
            filesChanged: detail.filesChanged,
            insertions: detail.insertions,
            deletions: detail.deletions,
          });
        }
      })
      .catch((err: any) => {
        console.error("Error fetching commit stats for popover:", err);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commit.hash, repoPath]);

  return (
    <div
      style={{ position: "fixed", top: Math.max(8, top), left }}
      className="z-50 w-[300px] bg-[#2a2b2f] border border-white/[0.12] rounded-xl
                 shadow-2xl shadow-black/60 p-4 pointer-events-none"
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar seed={author.name} className="rounded-full" width={36} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#e8e8ea] leading-tight truncate">
            {author.name}
          </p>
          <p className="text-[11px] text-[#555760] truncate">{author.email}</p>
        </div>
      </div>

      {/* Commit title */}
      <p className="text-[12px] text-[#e8e8ea] font-medium leading-snug mb-2">
        {commit.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10.5px] text-[#555760]">
        <span className="font-mono text-[#4b8ef0]">
          {commit.hash.slice(0, 7)}
        </span>
        {commit.date && (
          <>
            <span>·</span>
            <span>{parseGitDate(commit.date).toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex gap-2 animate-pulse">
          <div className="h-3 w-24 bg-[#3a3b3f] rounded" />
          <div className="h-3 w-16 bg-[#238636]/30 rounded" />
          <div className="h-3 w-16 bg-[#f85149]/30 rounded" />
        </div>
      ) : stats ? (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] text-[10.5px] text-[#888a91] flex items-center gap-1 flex-wrap">
          <span>
            {stats.filesChanged} file{stats.filesChanged !== 1 ? "s" : ""}{" "}
            changed,
          </span>
          <span className="text-[#56d364]">
            {stats.insertions} insertions(+),
          </span>
          <span className="text-[#f85149]">{stats.deletions} deletions(-)</span>
        </div>
      ) : null}
    </div>
  );
}

// ── Main Sidebar component ────────────────────────────────────────────────────
export default function Sidebar() {
  const {
    repoLoaded,
    repoPath,
    commits,
    mailmap,
    selectedCommit,
    pendingChanges,
    selectCommit,
    setView,
    handleAddContributor: addContributorToContext,
    loadMoreCommits,
    hasMore,
    isLoadingMore,
  } = useAppContext();

  const selectedHash = selectedCommit?.hash ?? null;
  const onSelectCommit = (commit: Commit) => selectCommit(commit);
  const onDryRun = () => setView("dry-run");
  const onApply = () => setView("apply");
  const onAddContributor = (identity: Identity) =>
    addContributorToContext(identity);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreCommits();
        }
      },
      { threshold: 0.1 },
    );
    const currentSentinel = loaderRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loadMoreCommits, hasMore, commits]);

  const [activeTab, setActiveTab] = useState<"changes" | "contributors">(
    "changes",
  );
  const [popover, setPopover] = useState<PopoverData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // commits are already in newest-first order
  const displayCommits = commits;

  const changeCount = pendingChanges.size;

  // Commit counts per contributor
  const commitCounts = commits.reduce<Record<string, number>>((acc, c) => {
    const key = `${c.originalAuthor.name}|${c.originalAuthor.email}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const contributors = Object.entries(mailmap).map(([slot, id]) => ({
    slot: Number(slot),
    id,
    count: commitCounts[`${id.name}|${id.email}`] ?? 0,
  }));

  const handleAddContributor = () => {
    if (newName.trim() && newEmail.trim()) {
      onAddContributor({ name: newName.trim(), email: newEmail.trim() });
      setNewName("");
      setNewEmail("");
      setShowAddForm(false);
    }
  };

  return (
    <>
      <aside className="w-full h-full bg-[#252629] flex flex-col overflow-hidden">
        {/* ── Tab Bar ── */}
        <div className="flex shrink-0 border-b border-white/[0.08]">
          {(["changes", "contributors"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "relative flex-1 py-2.5 text-[12.5px] font-medium cursor-pointer",
                "transition-colors duration-150 bg-transparent border-0 capitalize",
                activeTab === tab
                  ? "text-[#e8e8ea] sidebar-tab-active"
                  : "text-[#888a91] hover:text-[#e8e8ea]",
              ].join(" ")}
            >
              {tab === "changes" ? "Changes" : "Contributors"}
            </button>
          ))}
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === "changes" ? (
            /* ── Commit Tree ── */
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {!repoLoaded ? (
                <p className="px-4 py-5 text-[11.5px] text-[#555760] leading-relaxed">
                  Select a repository to view its commit history.
                </p>
              ) : displayCommits.length === 0 ? (
                <p className="px-4 py-5 text-[11.5px] text-[#555760]">
                  No commits found.
                </p>
              ) : (
                <div className="relative">
                  {/* Graph backbone line */}
                  <div className="absolute left-[27px] top-5 bottom-5 w-[2px] bg-[#e8e8ea]/25 rounded-full" />

                  {displayCommits.map((commit, displayIdx) => {
                    const isHead = displayIdx === 0;
                    const isSelected = commit.hash === selectedHash;
                    const hasPending = pendingChanges.has(commit.hash);
                    const author =
                      mailmap[commit.committer] ?? commit.originalAuthor;

                    return (
                      <div
                        key={commit.hash}
                        className="relative"
                        onMouseEnter={(e) => {
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          setPopover({
                            commit,
                            top: rect.top,
                            left: rect.right + 8,
                          });
                        }}
                        onMouseLeave={() => setPopover(null)}
                      >
                        <div
                          onClick={() => onSelectCommit(commit)}
                          className={[
                            "flex items-start gap-3 pl-3 pr-2.5 py-2 cursor-pointer",
                            "border-l-2 transition-all duration-100",
                            isSelected
                              ? "bg-[#ec4f31]/12 border-[#ec4f31]"
                              : "border-transparent hover:bg-white/[0.035]",
                          ].join(" ")}
                        >
                          {/* Graph node */}
                          <div className="shrink-0 w-7 flex items-center justify-center mt-1.5">
                            {isHead ? (
                              /* HEAD: filled circle */
                              <div className="w-3.5 h-3.5 rounded-full bg-[#ec4f31] border-2 border-[#ec4f31] shadow-[0_0_6px_#ec4f31aa]" />
                            ) : (
                              /* Normal: hollow circle */
                              <div
                                className={[
                                  "w-2.5 h-2.5 rounded-full border-2 transition-colors",
                                  isSelected
                                    ? "bg-[#ec4f31] border-[#ec4f31]"
                                    : "bg-[#252629] border-[#ec4f31]/60 hover:border-[#ec4f31]",
                                ].join(" ")}
                              />
                            )}
                          </div>

                          {/* Commit info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p
                                className={[
                                  "text-[12px] truncate flex-1",
                                  isSelected
                                    ? "text-[#e8e8ea] font-semibold"
                                    : "text-[#c8c9cc]",
                                ].join(" ")}
                              >
                                {pendingChanges.get(commit.hash)?.newTitle ??
                                  commit.title}
                              </p>
                              {isHead && (
                                <span className="shrink-0 text-[8.5px] font-bold text-[#238636] bg-[#238636]/20 border border-[#238636]/35 px-1.5 py-0.5 rounded-full leading-none">
                                  main
                                </span>
                              )}
                              {hasPending && (
                                <span
                                  className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#c9a227]"
                                  title="Has pending changes"
                                />
                              )}
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1 text-[10.5px] text-text-muted",
                                isSelected ? "text-gray-300" : "",
                              )}
                            >
                              <span className="truncate max-w-[100px]">
                                {author.name}
                              </span>
                              <span className="text-[#3a3b3f]">·</span>
                              <span className="whitespace-nowrap">
                                {relativeTime(commit.date)}
                              </span>
                            </div>
                          </div>

                          {/* Author avatar */}
                          <Avatar
                            seed={author.name}
                            width={28}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Infinite scroll sentinel */}
                  {hasMore && (
                    <div
                      ref={loaderRef}
                      className="py-4 flex justify-center items-center"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#888a91]">
                          <div className="w-3.5 h-3.5 border border-[#888a91] border-t-transparent rounded-full animate-spin" />
                          <span>Loading more commits…</span>
                        </div>
                      ) : (
                        <div className="h-4" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Contributors Tab ── */
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {contributors.map(({ id, count }) => (
                <div
                  key={`${id.name}|${id.email}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.035] transition-colors"
                >
                  <Avatar seed={id.name} width={28} className="rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-[#e8e8ea] truncate">
                      {id.name}
                    </p>
                    <p className="text-[10.5px] text-[#555760] truncate">
                      {id.email}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-text-primary bg-white/[0.06] px-2 py-0.5 rounded-full shrink-0">
                    {count}
                  </span>
                </div>
              ))}

              {/* Add contributor form / button */}
              {showAddForm ? (
                <div className="mx-3 mt-2 bg-[#1c1d20] border border-white/[0.09] rounded-xl p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-transparent border border-white/[0.09] rounded-lg px-2.5 py-1.5
                               text-[12px] text-[#e8e8ea] placeholder:text-[#555760]
                               focus:outline-none focus:border-[#ec4f31] transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddContributor()
                    }
                    className="w-full bg-transparent border border-white/[0.09] rounded-lg px-2.5 py-1.5
                               text-[12px] text-[#e8e8ea] placeholder:text-[#555760]
                               focus:outline-none focus:border-[#ec4f31] transition-colors"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddContributor}
                      className="flex-1 !text-[11px]"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 !text-[11px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] text-[#555760]
                             hover:text-[#888a91] hover:bg-white/[0.035] transition-all"
                >
                  <Plus size={13} />
                  Add contributor
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Footer: changes + actions ── */}
        <div className="shrink-0 border-t border-white/[0.08] bg-[#1e1f22]">
          {changeCount > 0 && (
            <div className="px-4 py-2 border-b border-white/[0.05]">
              <p className="text-[11px] font-semibold text-[#c9a227]">
                {changeCount} commit{changeCount !== 1 ? "s" : ""} changed
              </p>
            </div>
          )}
          <div className="flex gap-2 p-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDryRun}
              disabled={changeCount === 0}
              className="flex-1 !text-[11.5px]"
            >
              Dry Run
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onApply}
              disabled={changeCount === 0}
              className="flex-1 !text-[11.5px]"
            >
              Apply
            </Button>
          </div>
        </div>
      </aside>

      {/* Hover popover — rendered outside the aside to escape overflow */}
      {popover && (
        <CommitPopover data={popover} mailmap={mailmap} repoPath={repoPath} />
      )}
    </>
  );
}
