import { useState } from 'react';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Copy, Check, Terminal,
} from 'lucide-react';
import ChangeCard from './ChangeCard';
import Button from './ui/button';
import { useAppContext } from '../context/AppContext';

import { RewriteHistory } from '../../bindings/changeme/git/service';

const PUSH_CMD = 'git push origin --force --all';

export default function ApplyView() {
  const { repoPath, commits, mailmap, pendingChanges, setView, handleComplete } = useAppContext();

  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const changedCommits = [...commits]
    .reverse()
    .filter((c) => pendingChanges.has(c.hash));

  const copyCmd = () => {
    navigator.clipboard.writeText(PUSH_CMD).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    try {
      const overrides: Record<string, { name: string; email: string }> = {};
      for (const commit of changedCommits) {
        const change = pendingChanges.get(commit.hash)!;
        overrides[commit.hash] =
          change.newAuthor ?? mailmap[commit.committer] ?? commit.originalAuthor;
      }
      await RewriteHistory(repoPath, overrides);
      setSuccess(true);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-10">
        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#e8e8ea] mb-2">History Rewritten!</h2>
          <p className="text-[13px] text-[#888a91]">
            Your commit history has been successfully updated.
          </p>
        </div>

        {/* Push command */}
        <div className="w-full max-w-md bg-[#252629] border border-white/[0.08] rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <Terminal size={12} className="text-[#c9a227]" />
            <span className="text-[10.5px] font-semibold text-[#888a91] uppercase tracking-widest">
              Push to remote
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5">
            <code className="flex-1 font-mono text-[12px] text-yellow-400 select-all">
              {PUSH_CMD}
            </code>
            <button
              onClick={copyCmd}
              className="text-[#555760] hover:text-[#e8e8ea] transition-colors shrink-0"
            >
              {copied ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
          <p className="text-[10.5px] text-[#555760] mt-2">
            Run this in your terminal to update the remote.
          </p>
        </div>

        <Button variant="ghost" onClick={handleComplete}>
          Start Over
        </Button>
      </div>
    );
  }

  // ── Apply confirmation state ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#1a1b1e]">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/[0.05] shrink-0">
        <button
          onClick={() => setView('dry-run')}
          disabled={isApplying}
          className="p-1.5 rounded-lg text-[#555760] hover:text-[#e8e8ea] hover:bg-white/[0.06]
                     transition-all shrink-0 disabled:opacity-40"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-[#e8e8ea]">Apply Changes</h2>
          <p className="text-[12px] text-[#555760] mt-0.5">
            This will permanently rewrite your repository history.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ⚠ Warning banner */}
        <div className="mx-8 mt-6 bg-amber-500/10 border border-amber-500/25 rounded-xl p-5">
          <div className="flex items-start gap-3.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-amber-300 mb-1">Destructive Operation</p>
              <p className="text-[12px] text-amber-400/80 leading-relaxed mb-3">
                This rewrites Git history using{' '}
                <code className="font-mono bg-black/20 px-1 rounded text-[11px]">git filter-repo</code>.
                The operation is <strong className="text-amber-300">irreversible</strong>. Ensure you
                have a backup and coordinate with your team before force-pushing.
              </p>
              {/* Push command */}
              <div className="flex items-center gap-2 bg-black/25 rounded-lg px-3 py-2 text-[12px]">
                <code className="flex-1 font-mono text-amber-300 select-all">{PUSH_CMD}</code>
                <button
                  onClick={copyCmd}
                  className="text-amber-500/60 hover:text-amber-300 transition-colors shrink-0"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-[12px]">
              {error}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-end">
            <Button
              variant="danger"
              onClick={handleApply}
              loading={isApplying}
              icon={<AlertTriangle size={14} />}
            >
              {isApplying ? 'Rewriting History…' : 'Complete Rewrite'}
            </Button>
          </div>
        </div>

        {/* Changes to apply */}
        <div className="px-8 mt-6 pb-10">
          <p className="text-[10.5px] font-semibold text-[#555760] uppercase tracking-widest mb-3">
            Changes to apply ({changedCommits.length})
          </p>
          <div className="space-y-3">
            {changedCommits.map((commit) => (
              <ChangeCard
                key={commit.hash}
                commit={commit}
                change={pendingChanges.get(commit.hash)!}
                mailmap={mailmap}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
