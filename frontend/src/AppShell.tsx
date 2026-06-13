import { GitCommit } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import RepoSelectPage from './components/RepoSelectPage';
import CommitDiffView from './components/CommitDiffView';
import DryRunView from './components/DryRunView';
import ApplyView from './components/ApplyView';

export default function AppShell() {
  const { view, repoPath, selectedCommit } = useAppContext();

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-[#e8e8ea] overflow-hidden">
      {/* ── Top Bar ── */}
      <TopBar />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — only shown when in 'main' view with a repo */}
        {repoPath && view === 'main' && <Sidebar />}

        {/* ── Main content ── */}
        <main className="flex flex-col flex-1 bg-[#1a1b1e] min-w-0 overflow-hidden">
          {view === 'repo-select' && <RepoSelectPage />}

          {view === 'dry-run' && <DryRunView />}

          {view === 'apply' && <ApplyView />}

          {view === 'main' && !selectedCommit && (
            /* No commit selected — empty state */
            <EmptyState />
          )}

          {view === 'main' && selectedCommit && <CommitDiffView />}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  const { repoPath } = useAppContext();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
      <div className="w-14 h-14 bg-[#ec4f31]/10 border border-[#ec4f31]/20 rounded-2xl flex items-center justify-center">
        <GitCommit size={24} className="text-[#ec4f31]/50" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-[#888a91] mb-1">
          {repoPath ? 'Select a commit' : 'No repository open'}
        </p>
        <p className="text-[11.5px] text-[#555760]">
          {repoPath
            ? 'Click any commit in the sidebar to view its diff'
            : 'Click "Current Repository" in the top bar to get started'}
        </p>
      </div>
    </div>
  );
}
