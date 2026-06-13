import { ArrowRight } from 'lucide-react';
import { Commit, Identity, PendingChange } from '../types';
import { parseGitDate } from '../lib/date';

interface ChangeCardProps {
  commit: Commit;
  change: PendingChange;
  mailmap: Record<number, Identity>;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  const COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ];
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div
      className={`w-5 h-5 ${color} rounded-full flex items-center justify-center
                  text-[8px] font-bold text-white shrink-0 select-none`}
    >
      {initials}
    </div>
  );
}

export default function ChangeCard({ commit, change, mailmap }: ChangeCardProps) {
  const oldAuthor = commit.originalAuthor;
  const { newAuthor, newTitle, newDate } = change;

  return (
    <div className="bg-[#252629] border border-white/[0.08] rounded-xl p-4 space-y-3 hover:border-white/[0.13] transition-colors duration-150">
      {/* Commit identifier + title */}
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 font-mono text-[10.5px] text-[#4b8ef0] bg-[#4b8ef0]/10 px-2 py-0.5 rounded shrink-0">
          {commit.hash.slice(0, 7)}
        </span>
        <span className="text-[13px] text-[#e8e8ea] font-medium leading-snug">
          {newTitle ?? commit.title}
        </span>
      </div>

      {/* Author change */}
      {newAuthor && (
        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={oldAuthor.name} />
            <span className="text-[11.5px] text-[#888a91] truncate">{oldAuthor.name}</span>
          </div>
          <ArrowRight size={11} className="text-[#555760] shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={newAuthor.name} />
            <span className="text-[11.5px] text-[#4b8ef0] truncate font-medium">{newAuthor.name}</span>
          </div>
        </div>
      )}

      {/* Title change (only if different from original) */}
      {newTitle && newTitle !== commit.title && (
        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
          <span className="text-[11.5px] text-[#888a91] line-through truncate flex-1 min-w-0">
            {commit.title}
          </span>
          <ArrowRight size={10} className="text-[#555760] shrink-0" />
          <span className="text-[11.5px] text-[#4b8ef0] truncate flex-1 min-w-0">{newTitle}</span>
        </div>
      )}

      {/* Date change */}
      {newDate && newDate !== commit.date && (
        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 text-[11px]">
          <span className="text-[#888a91]">
            {commit.date ? parseGitDate(commit.date).toLocaleDateString() : 'unknown'}
          </span>
          <ArrowRight size={10} className="text-[#555760] shrink-0" />
          <span className="text-[#4b8ef0]">{parseGitDate(newDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
