import { ArrowLeft, Eye } from 'lucide-react';
import { Commit, Identity, PendingChange } from '../types';
import ChangeCard from './ChangeCard';
import AppButton from './AppButton';

interface DryRunViewProps {
  commits: Commit[];
  mailmap: Record<number, Identity>;
  pendingChanges: Map<string, PendingChange>;
  onBack: () => void;
  onProceedToApply: () => void;
}

export default function DryRunView({
  commits,
  mailmap,
  pendingChanges,
  onBack,
  onProceedToApply,
}: DryRunViewProps) {
  // Display newest first (match the sidebar tree order)
  const changedCommits = [...commits]
    .reverse()
    .filter((c) => pendingChanges.has(c.hash));

  return (
    <div className="flex flex-col h-full bg-[#1a1b1e]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/[0.05] shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-[#555760] hover:text-[#e8e8ea] hover:bg-white/[0.06] transition-all shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-[#e8e8ea]">Dry Run Preview</h2>
          <p className="text-[12px] text-[#555760] mt-0.5">
            No changes will be made. Review what will be rewritten.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[11px] text-[#888a91] bg-white/[0.05] border border-white/[0.07] rounded-full px-3 py-1">
            {changedCommits.length} commit{changedCommits.length !== 1 ? 's' : ''} will change
          </span>
          <AppButton
            variant="primary"
            size="sm"
            icon={<Eye size={13} />}
            onClick={onProceedToApply}
            disabled={changedCommits.length === 0}
          >
            Proceed to Apply
          </AppButton>
        </div>
      </div>

      {/* ── Card list ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
        {changedCommits.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center pb-12">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.07] rounded-xl flex items-center justify-center">
              <Eye size={20} className="text-[#555760]" />
            </div>
            <p className="text-[13px] text-[#555760]">No pending changes to preview.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
