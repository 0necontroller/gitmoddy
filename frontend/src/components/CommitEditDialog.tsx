import { useState } from 'react';
import { X } from 'lucide-react';
import { Commit, PendingChange } from '../types';
import AppButton from './AppButton';

interface CommitEditDialogProps {
  commit: Commit;
  commitIndex: number; // index in the original (oldest→newest) array
  allCommits: Commit[];
  existing?: PendingChange;
  onSave: (change: PendingChange) => void;
  onClose: () => void;
}

/** Convert ISO 8601 date string to the value expected by datetime-local inputs */
function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export default function CommitEditDialog({
  commit,
  commitIndex,
  allCommits,
  existing,
  onSave,
  onClose,
}: CommitEditDialogProps) {
  const [title, setTitle] = useState(existing?.newTitle ?? commit.title);
  const [dateLocal, setDateLocal] = useState(
    toDatetimeLocal(existing?.newDate ?? commit.date)
  );

  // Chronological constraints — prev commit is index-1, next commit is index+1
  // allCommits is oldest→newest, so prev = index-1, next = index+1
  const prevCommit = commitIndex > 0 ? allCommits[commitIndex - 1] : null;
  const nextCommit = commitIndex < allCommits.length - 1 ? allCommits[commitIndex + 1] : null;
  const minDate = prevCommit?.date ? toDatetimeLocal(prevCommit.date) : undefined;
  const maxDate = nextCommit?.date ? toDatetimeLocal(nextCommit.date) : undefined;

  const handleSave = () => {
    const change: PendingChange = {};
    if (title.trim() && title.trim() !== commit.title) {
      change.newTitle = title.trim();
    }
    if (dateLocal) {
      const iso = new Date(dateLocal).toISOString();
      if (iso !== new Date(commit.date).toISOString()) {
        change.newDate = iso;
      }
    }
    onSave(change);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[#252629] border border-white/[0.10] rounded-2xl w-[460px] shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-[14px] font-semibold text-[#e8e8ea]">Edit Commit</h3>
            <p className="text-[10.5px] text-[#555760] font-mono mt-0.5">{commit.hash.slice(0, 16)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#555760] hover:text-[#e8e8ea] hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10.5px] font-semibold text-[#888a91] mb-2 uppercase tracking-widest">
              Commit Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1c1d20] border border-white/[0.12] rounded-lg px-3 py-2.5
                         text-[13px] text-[#e8e8ea] focus:outline-none focus:border-[#4b8ef0]
                         transition-colors duration-150 placeholder:text-[#555760]"
              placeholder="Commit message…"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10.5px] font-semibold text-[#888a91] mb-2 uppercase tracking-widest">
              Author Date
            </label>
            <input
              type="datetime-local"
              value={dateLocal}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDateLocal(e.target.value)}
              className="w-full bg-[#1c1d20] border border-white/[0.12] rounded-lg px-3 py-2.5
                         text-[13px] text-[#e8e8ea] focus:outline-none focus:border-[#4b8ef0]
                         transition-colors duration-150 [color-scheme:dark]"
            />
            {(minDate || maxDate) && (
              <p className="text-[10.5px] text-[#555760] mt-1.5 space-x-2">
                {minDate && <span>After: {new Date(minDate).toLocaleString()}</span>}
                {minDate && maxDate && <span>·</span>}
                {maxDate && <span>Before: {new Date(maxDate).toLocaleString()}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.08]">
          <AppButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </AppButton>
        </div>
      </div>
    </div>
  );
}
