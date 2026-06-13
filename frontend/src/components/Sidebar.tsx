import { useState } from 'react';
import { ChevronRight, GitBranch } from 'lucide-react';

interface SidebarFile {
  path: string;
  checked: boolean;
}

interface SidebarProps {
  step: number;
  repoPath: string;
  files?: SidebarFile[];
  commitTitle?: string;
}

const DEMO_FILES: SidebarFile[] = [];

export default function Sidebar({ step, repoPath, files = DEMO_FILES, commitTitle = '' }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [description, setDescription] = useState('');

  const displayFiles = files.length > 0 ? files : [];
  const fileCount = displayFiles.length;

  return (
    // sidebar: 260px wide, dark bg, right border, flex column
    <aside className="w-[260px] shrink-0 bg-[#252629] border-r border-white/[0.08] flex flex-col overflow-hidden">

      {/* ── Tab Bar ── */}
      <div className="flex shrink-0 border-b border-white/[0.08]">
        {(['changes', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'relative flex-1 py-2.5 text-[13px] font-medium cursor-pointer transition-colors duration-150',
              'capitalize bg-transparent border-0',
              activeTab === tab
                ? 'text-[#e8e8ea] sidebar-tab-active'
                : 'text-[#888a91] hover:text-[#e8e8ea]',
            ].join(' ')}
          >
            {tab === 'changes' ? 'Changes' : 'History'}
          </button>
        ))}
      </div>

      {/* ── File List Section ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Section header */}
        <div className="shrink-0 px-3.5 pt-2 pb-1.5 text-[11px] font-medium text-[#888a91]">
          {fileCount > 0 ? `${fileCount} changed file${fileCount !== 1 ? 's' : ''}` : 'No changed files'}
        </div>

        {/* File items */}
        <div className="flex-1 overflow-y-auto py-0.5 custom-scrollbar">
          {displayFiles.map((file, i) => {
            const parts = file.path.split('/');
            const name = parts.pop() ?? file.path;
            const dir = parts.join('/') + (parts.length ? '/' : '');
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3.5 py-[5px] cursor-pointer transition-colors duration-100 hover:bg-white/[0.045]"
              >
                <input
                  type="checkbox"
                  defaultChecked={file.checked}
                  className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-[#4b8ef0]"
                />
                <span className="flex-1 font-mono text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-[#555760]">{dir}</span>
                  <span className="text-[#e8e8ea]">{name}</span>
                </span>
                {/* Gold "M" badge */}
                <span className="shrink-0 text-[10px] font-semibold text-[#c9a227] border border-[#c9a227] w-4 h-4 flex items-center justify-center rounded-[3px]">
                  M
                </span>
              </div>
            );
          })}

          {displayFiles.length === 0 && step === 1 && (
            <p className="px-3.5 py-4 text-[11.5px] text-[#555760] leading-relaxed">
              Select a repository to see changed files
            </p>
          )}
        </div>
      </div>

      {/* ── Stashed Changes ── */}
      <div className="shrink-0 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 px-3.5 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-white/[0.045]">
          <GitBranch size={13} className="text-[#888a91]" />
          <span className="flex-1 text-[12.5px] text-[#888a91]">Stashed changes</span>
          <ChevronRight size={13} className="text-[#555760]" />
        </div>
      </div>

      {/* ── Commit Box ── */}
      <div className="shrink-0 border-t border-white/[0.08] px-3 py-2.5 bg-[#252629]">
        {commitTitle && (
          <p className="text-[11.5px] text-[#888a91] mb-1.5 pl-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            {commitTitle}
          </p>
        )}
        <div className="flex gap-2 items-start">
          {/* Avatar placeholder */}
          <div className="shrink-0 mt-0.5 w-[22px] h-[22px] rounded-full bg-[#555760] border border-white/[0.13]" />
          <textarea
            className="flex-1 bg-[#1c1d20] border border-white/[0.13] rounded-[6px] px-[9px] py-[7px]
                       text-xs text-[#e8e8ea] font-[inherit] resize-none outline-none leading-[1.45]
                       placeholder:text-[#555760] focus:border-[#4b8ef0] transition-colors duration-150"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </aside>
  );
}
