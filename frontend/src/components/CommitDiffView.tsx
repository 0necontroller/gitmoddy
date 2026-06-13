import { useState, useEffect } from "react";
import { GitCommit, Settings, Plus, Minus } from "lucide-react";
import { CommitDetail } from "../types";
import AuthorSelect from "./AuthorSelect";
import CommitEditDialog from "./CommitEditDialog";
import { useAppContext } from "../context/AppContext";
import { parseGitDate } from "../lib/date";

import { GetCommitDetail } from "../../bindings/changeme/git/service";
import Avatar from "./Avatar";

// ─── Diff line renderer ────────────────────────────────────────────────────────
function DiffLine({ line }: { line: string }) {
  if (
    line.startsWith("diff --git") ||
    line.startsWith("index ") ||
    line.startsWith("new file mode")
  ) {
    return (
      <div className="bg-[#2a2b2f] text-[#888a91] font-mono text-[11px] leading-[1.6] px-4 py-0.5 mt-4 border-y border-white/[0.05] whitespace-pre-wrap break-all">
        {line}
      </div>
    );
  }
  if (line.startsWith("--- ") || line.startsWith("+++ ")) {
    return (
      <div className="text-[#888a91] font-mono text-[11px] leading-[1.6] px-4 whitespace-pre-wrap break-all">
        {line}
      </div>
    );
  }
  if (line.startsWith("@@")) {
    return (
      <div className="bg-[#388bfd]/10 text-[#79c0ff] font-mono text-[11px] leading-[1.6] px-4 whitespace-pre-wrap break-all">
        {line}
      </div>
    );
  }
  if (line.startsWith("+")) {
    return (
      <div className="bg-[#23863622] text-[#56d364] font-mono text-[11px] leading-[1.6] px-4 whitespace-pre-wrap break-all">
        {line}
      </div>
    );
  }
  if (line.startsWith("-")) {
    return (
      <div className="bg-[#f8514922] text-[#f85149] font-mono text-[11px] leading-[1.6] px-4 whitespace-pre-wrap break-all">
        {line}
      </div>
    );
  }
  return (
    <div className="text-[#c8c9cc] font-mono text-[11px] leading-[1.6] px-4 whitespace-pre-wrap break-all">
      {line}
    </div>
  );
}

export default function CommitDiffView() {
  const {
    selectedCommit: commit,
    prevCommitDate,
    nextCommitDate,
    repoPath,
    mailmap,
    pendingChanges,
    handleAuthorChange,
    handleCommitEdit,
  } = useAppContext();

  const [detail, setDetail] = useState<CommitDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!commit) return null;

  const pendingChange = pendingChanges.get(commit.hash);

  // Determine effective author slot
  const effectiveAuthorSlot = (() => {
    if (!pendingChange?.newAuthor) return commit.committer;
    const found = Object.entries(mailmap).find(
      ([, id]) =>
        id.name === pendingChange.newAuthor?.name &&
        id.email === pendingChange.newAuthor?.email,
    );
    return found ? Number(found[0]) : commit.committer;
  })();

  const displayTitle = pendingChange?.newTitle ?? commit.title;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setLoadError(null);

    GetCommitDetail(repoPath, commit.hash)
      .then((d: CommitDetail | null) => {
        if (!cancelled && d) setDetail(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [commit.hash, repoPath]);

  const hasPending = !!pendingChange;

  return (
    <>
      {/* ── Sub-header bar ── */}
      <div className="flex items-center justify-between px-4 h-[42px] bg-[#2a2b2f] border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <GitCommit
            size={14}
            className={hasPending ? "text-[#c9a227]" : "text-[#888a91]"}
          />
          <span className="font-mono text-[10.5px] text-[#888a91]">
            {commit.hash.slice(0, 7)}
          </span>
          {hasPending && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] shrink-0" />
          )}
          <span className="text-[12px] text-[#c8c9cc] truncate">
            {displayTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Avatar
            seed={mailmap[effectiveAuthorSlot].name}
            className="rounded-full"
            width={25}
          />
          <AuthorSelect
            mailmap={mailmap}
            value={effectiveAuthorSlot}
            onChange={handleAuthorChange}
          />
          <button
            onClick={() => setEditOpen(true)}
            title="Edit commit details"
            className="p-1.5 rounded-lg text-[#c9a227] opacity-75 hover:opacity-100
                       hover:bg-white/[0.06] transition-all"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ── Diff content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {loading && (
          <div className="p-6 space-y-6 animate-pulse">
            {/* Header / Commit metadata card skeleton */}
            <div className="bg-[#252629] border border-white/[0.08] rounded-xl p-5 space-y-4">
              <div className="h-5 bg-[#3a3b3f] rounded w-2/3" />
              <div className="h-4 bg-[#3a3b3f] rounded w-1/2" />
              <div className="pt-3 border-t border-white/[0.06] flex gap-3">
                <div className="h-3.5 bg-[#3a3b3f] rounded w-24" />
                <div className="h-3.5 bg-[#3a3b3f] rounded w-32" />
                <div className="h-3.5 bg-[#238636]/20 rounded w-16" />
                <div className="h-3.5 bg-[#f85149]/20 rounded w-16" />
              </div>
            </div>

            {/* Diff lines skeleton */}
            <div className="space-y-3 font-mono">
              <div className="h-3.5 bg-[#3a3b3f]/60 rounded w-5/6 px-4" />
              <div className="h-3.5 bg-[#238636]/15 rounded w-full px-4" />
              <div className="h-3.5 bg-[#238636]/15 rounded w-4/5 px-4" />
              <div className="h-3.5 bg-[#f85149]/15 rounded w-11/12 px-4" />
              <div className="h-3.5 bg-[#3a3b3f]/60 rounded w-3/4 px-4" />
            </div>
          </div>
        )}

        {loadError && (
          <div className="m-6 p-4 bg-red-900/20 border border-red-500/25 rounded-xl text-red-400 text-sm">
            {loadError}
          </div>
        )}

        {detail && (
          <>
            {/* Commit metadata card */}
            <div className="mx-5 mt-5 bg-[#252629] border border-white/[0.08] rounded-xl p-4">
              <h3 className="text-[14px] font-semibold text-[#e8e8ea] mb-1 leading-snug">
                {displayTitle}
              </h3>
              {detail.body && (
                <p className="text-[12px] text-[#888a91] mt-1 whitespace-pre-wrap">
                  {detail.body}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#555760]">
                <span className="text-[#888a91]">
                  {mailmap[effectiveAuthorSlot]?.name ?? detail.authorName}
                </span>
                <span>·</span>
                <span>
                  {detail.date ? parseGitDate(detail.date).toLocaleString() : "—"}
                </span>
                {detail.filesChanged > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      {detail.filesChanged} file
                      {detail.filesChanged !== 1 ? "s" : ""} changed
                    </span>
                  </>
                )}
                {detail.insertions > 0 && (
                  <span className="flex items-center gap-0.5 text-[#56d364]">
                    <Plus size={10} />
                    {detail.insertions}
                  </span>
                )}
                {detail.deletions > 0 && (
                  <span className="flex items-center gap-0.5 text-[#f85149]">
                    <Minus size={10} />
                    {detail.deletions}
                  </span>
                )}
              </div>
            </div>

            {/* Diff lines */}
            {detail.diff ? (
              <div className="mt-4 pb-8">
                {detail.diff.split("\n").map((line, i) => (
                  <DiffLine key={i} line={line} />
                ))}
              </div>
            ) : (
              <p className="mx-5 mt-4 text-[12px] text-[#555760]">
                No diff available for this commit (may be initial commit or
                binary changes).
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Edit dialog ── */}
      {editOpen && (
        <CommitEditDialog
          commit={commit}
          prevCommitDate={prevCommitDate}
          nextCommitDate={nextCommitDate}
          existing={pendingChange}
          onSave={handleCommitEdit}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
