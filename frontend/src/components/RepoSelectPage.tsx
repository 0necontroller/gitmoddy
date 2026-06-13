import { Clock, FolderOpen, FolderX, ChevronRight, GitBranch } from 'lucide-react';
import AppButton from './AppButton';

interface RepoSelectPageProps {
  recentRepos: string[];
  isLoading: boolean;
  error: string | null;
  onBrowse: () => void;
  onSelectRecent: (path: string) => void;
  onRemoveRecent: (path: string) => void;
}

function getRepoName(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path;
}

export default function RepoSelectPage({
  recentRepos,
  isLoading,
  error,
  onBrowse,
  onSelectRecent,
  onRemoveRecent,
}: RepoSelectPageProps) {
  return (
    <div className="flex flex-col h-full bg-[#1a1b1e]">
      {/* Page header */}
      <div className="px-10 pt-12 pb-8 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-[#4b8ef0]/15 border border-[#4b8ef0]/25 rounded-xl flex items-center justify-center">
            <GitBranch size={17} className="text-[#4b8ef0]" />
          </div>
          <h1 className="text-[22px] font-bold text-[#e8e8ea] tracking-tight">Select Repository</h1>
        </div>
        <p className="text-[13px] text-[#555760] ml-12">
          Open a local Git repository to browse and rewrite its history.
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8 space-y-8">

        {/* Browse section */}
        <div>
          <AppButton
            variant="primary"
            size="lg"
            icon={<FolderOpen size={16} />}
            onClick={onBrowse}
            loading={isLoading}
          >
            Browse for Repository
          </AppButton>

          {error && (
            <p className="mt-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Recent repos */}
        {recentRepos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-[#555760]" />
              <span className="text-[10.5px] font-semibold text-[#555760] uppercase tracking-widest">
                Recent Repositories
              </span>
            </div>

            <div className="space-y-1.5">
              {recentRepos.map((path) => (
                <div
                  key={path}
                  onClick={() => onSelectRecent(path)}
                  className="group flex items-center gap-3.5 bg-[#252629] hover:bg-[#2c2d31]
                             border border-white/[0.06] hover:border-white/[0.12] rounded-xl
                             px-4 py-3.5 cursor-pointer transition-all duration-150"
                >
                  {/* Folder icon */}
                  <div className="w-9 h-9 bg-[#4b8ef0]/10 border border-[#4b8ef0]/20 rounded-lg
                                  flex items-center justify-center shrink-0 transition-colors
                                  group-hover:bg-[#4b8ef0]/15 group-hover:border-[#4b8ef0]/30">
                    <FolderOpen size={15} className="text-[#4b8ef0]" />
                  </div>

                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#e8e8ea] truncate">
                      {getRepoName(path)}
                    </p>
                    <p className="text-[11px] text-[#555760] truncate mt-0.5">{path}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title="Remove from recent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecent(path);
                      }}
                      className="p-1.5 rounded-lg text-transparent group-hover:text-[#555760]
                                 hover:!text-[#e8e8ea] hover:bg-white/[0.06] transition-all"
                    >
                      <FolderX size={13} />
                    </button>
                    <ChevronRight
                      size={14}
                      className="text-[#555760] opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentRepos.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.07] rounded-2xl
                            flex items-center justify-center">
              <FolderOpen size={22} className="text-[#555760]" />
            </div>
            <p className="text-[12.5px] text-[#555760]">
              No recent repositories. Browse to open one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
