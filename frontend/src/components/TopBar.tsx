import { ChevronRight, GitBranch, Download } from 'lucide-react';

interface TopBarProps {
  repoName: string;
  branchName?: string;
  fetchStatus?: string;
}

export default function TopBar({ repoName, branchName = '—', fetchStatus = 'Never fetched' }: TopBarProps) {
  return (
    <header className="topbar">
      {/* Panel 1: Current Repository */}
      <div className="topbar-panel">
        <div className="topbar-panel-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.5 2.5 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"
              fill="currentColor" />
          </svg>
        </div>
        <div className="topbar-panel-text">
          <span className="topbar-label">Current Repository</span>
          <span className="topbar-value">{repoName || '—'}</span>
        </div>
        <ChevronRight className="topbar-chevron" size={14} />
      </div>

      <div className="topbar-divider" />

      {/* Panel 2: Current Branch */}
      <div className="topbar-panel">
        <div className="topbar-panel-icon">
          <GitBranch size={15} />
        </div>
        <div className="topbar-panel-text">
          <span className="topbar-label">Current Branch</span>
          <span className="topbar-value">{branchName}</span>
        </div>
        <ChevronRight className="topbar-chevron" size={14} />
      </div>

      <div className="topbar-divider" />

      {/* Panel 3: Fetch / Pull Origin */}
      <div className="topbar-panel topbar-panel-right">
        <div className="topbar-panel-icon">
          <Download size={15} />
        </div>
        <div className="topbar-panel-text">
          <span className="topbar-label">Pull origin</span>
          <span className="topbar-value topbar-value-muted">{fetchStatus}</span>
        </div>
        <ChevronRight className="topbar-chevron" size={14} />
      </div>
    </header>
  );
}
