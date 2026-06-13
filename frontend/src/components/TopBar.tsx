import { ChevronRight, GitBranch, Download } from "lucide-react";

interface TopBarProps {
  repoName: string;
  branchName?: string;
  fetchStatus?: string;
}

export default function TopBar({
  repoName,
  branchName = "—",
  fetchStatus = "Never fetched",
}: TopBarProps) {
  return (
    // Full-width header, 52px tall, dark header bg, bottom border, flex row, macOS drag
    <header className="drag-region flex pl-24 items-stretch h-[52px] bg-header border-b border-white/8 shrink-0">
      {/* Divider */}
      <div className="w-px bg-white/8 self-stretch my-2" />

      {/* Panel 1: Current Repository */}
      <div className="no-drag-region flex items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/4.5">
        <span className="text-text-muted flex items-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.5 2.5 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"
            />
          </svg>
        </span>
        <div className="flex flex-col gap-px min-w-0">
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            Current Repository
          </span>
          <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
            {repoName || "—"}
          </span>
        </div>
        <ChevronRight size={14} className="text-text-dim shrink-0 ml-auto" />
      </div>

      {/* Divider */}
      <div className="w-px bg-white/8 self-stretch my-2" />

      {/* Panel 2: Current Branch */}
      <div className="no-drag-region flex items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/4.5">
        <GitBranch size={15} className="text-text-muted shrink-0" />
        <div className="flex flex-col gap-px min-w-0">
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            Current Branch
          </span>
          <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
            {branchName}
          </span>
        </div>
        <ChevronRight size={14} className="text-text-dim shrink-0 ml-auto" />
      </div>

      {/* Divider */}
      <div className="w-px bg-white/8 self-stretch my-2" />

      {/* Panel 3: Pull Origin */}
      <div className="no-drag-region flex flex-1 items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/4.5">
        <Download size={15} className="text-text-muted shrink-0" />
        <div className="flex flex-col gap-px min-w-0">
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            Pull origin
          </span>
          <span className="text-[13px] font-normal text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">
            {fetchStatus}
          </span>
        </div>
        <ChevronRight size={14} className="text-text-dim shrink-0 ml-auto" />
      </div>
    </header>
  );
}
