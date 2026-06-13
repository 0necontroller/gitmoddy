import { useState } from 'react';
import { SelectRepository, ScanRepository } from '../bindings/changeme/gitservice';
import { Identity, Commit, PendingChange, AppView } from './types';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import RepoSelectPage from './components/RepoSelectPage';
import CommitDiffView from './components/CommitDiffView';
import DryRunView from './components/DryRunView';
import ApplyView from './components/ApplyView';
import { GitCommit } from 'lucide-react';

// ── Recent repos persistence ──────────────────────────────────────────────────
const RECENT_KEY = 'gitmoddy_recent_repos';

function loadRecentRepos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveRecentRepos(repos: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(repos));
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<AppView>('repo-select');
  const [repoPath, setRepoPath] = useState('');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [mailmap, setMailmap] = useState<Record<number, Identity>>({});
  const [recentRepos, setRecentRepos] = useState<string[]>(loadRecentRepos);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedCommitIdx, setSelectedCommitIdx] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [synced, setSynced] = useState(false);

  const repoName = repoPath
    ? (repoPath.split('/').filter(Boolean).pop() ?? repoPath)
    : '';

  // ── Open a repo by path ───────────────────────────────────────────────────
  const openRepo = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ScanRepository(path);
      if (!result) throw new Error('No commits found in this repository.');

      setRepoPath(path);
      setCommits((result.commits ?? []) as unknown as Commit[]);
      setMailmap(result.mailmap as unknown as Record<number, Identity>);
      setPendingChanges(new Map());
      setSelectedCommit(null);
      setSynced(false);

      // Persist to recent repos (most recent first, max 10)
      const updated = [path, ...recentRepos.filter((r) => r !== path)].slice(0, 10);
      setRecentRepos(updated);
      saveRecentRepos(updated);

      setView('main');
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Browse via native dialog ──────────────────────────────────────────────
  const handleBrowse = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = await SelectRepository();
      if (!path) {
        setIsLoading(false);
        return;
      }
      await openRepo(path);
    } catch (err: unknown) {
      setError(String(err));
      setIsLoading(false);
    }
  };

  // ── Pending changes helpers ───────────────────────────────────────────────
  const handleAuthorChange = (slot: number) => {
    if (!selectedCommit) return;
    const newAuthor = mailmap[slot];
    if (!newAuthor) return;
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(selectedCommit.hash, { ...(next.get(selectedCommit.hash) ?? {}), newAuthor });
      return next;
    });
  };

  const handleCommitEdit = (change: PendingChange) => {
    if (!selectedCommit) return;
    setPendingChanges((prev) => {
      const next = new Map(prev);
      const merged = { ...(next.get(selectedCommit.hash) ?? {}), ...change };
      // Remove entry if all fields are cleared
      if (!merged.newAuthor && !merged.newTitle && !merged.newDate) {
        next.delete(selectedCommit.hash);
      } else {
        next.set(selectedCommit.hash, merged);
      }
      return next;
    });
  };

  const handleAddContributor = (identity: Identity) => {
    setMailmap((prev) => {
      const slots = Object.keys(prev).map(Number);
      const nextSlot = slots.length > 0 ? Math.max(...slots) + 1 : 1;
      return { ...prev, [nextSlot]: identity };
    });
  };

  // ── Reset everything ──────────────────────────────────────────────────────
  const handleComplete = () => {
    setView('repo-select');
    setRepoPath('');
    setCommits([]);
    setMailmap({});
    setPendingChanges(new Map());
    setSelectedCommit(null);
    setSynced(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-[#e8e8ea] overflow-hidden">
      {/* ── Top Bar ── */}
      <TopBar
        repoName={repoName}
        repoLoaded={!!repoPath}
        synced={synced}
        onRepoClick={() => setView('repo-select')}
        onSync={() => setSynced(true)}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — only shown when in 'main' view with a repo */}
        {repoPath && view === 'main' && (
          <Sidebar
            repoLoaded={!!repoPath}
            commits={commits}
            mailmap={mailmap}
            selectedHash={selectedCommit?.hash ?? null}
            pendingChanges={pendingChanges}
            onSelectCommit={(commit, idx) => {
              setSelectedCommit(commit);
              setSelectedCommitIdx(idx);
            }}
            onDryRun={() => setView('dry-run')}
            onApply={() => setView('apply')}
            onAddContributor={handleAddContributor}
          />
        )}

        {/* ── Main content ── */}
        <main className="flex flex-col flex-1 bg-[#1a1b1e] min-w-0 overflow-hidden">
          {view === 'repo-select' && (
            <RepoSelectPage
              recentRepos={recentRepos}
              isLoading={isLoading}
              error={error}
              onBrowse={handleBrowse}
              onSelectRecent={openRepo}
              onRemoveRecent={(path) => {
                const updated = recentRepos.filter((r) => r !== path);
                setRecentRepos(updated);
                saveRecentRepos(updated);
              }}
            />
          )}

          {view === 'dry-run' && (
            <DryRunView
              commits={commits}
              mailmap={mailmap}
              pendingChanges={pendingChanges}
              onBack={() => setView('main')}
              onProceedToApply={() => setView('apply')}
            />
          )}

          {view === 'apply' && (
            <ApplyView
              repoPath={repoPath}
              commits={commits}
              mailmap={mailmap}
              pendingChanges={pendingChanges}
              onBack={() => setView('dry-run')}
              onComplete={handleComplete}
            />
          )}

          {view === 'main' && !selectedCommit && (
            /* No commit selected — empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
              <div className="w-14 h-14 bg-[#4b8ef0]/10 border border-[#4b8ef0]/20 rounded-2xl flex items-center justify-center">
                <GitCommit size={24} className="text-[#4b8ef0]/50" />
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
          )}

          {view === 'main' && selectedCommit && (
            <CommitDiffView
              commit={selectedCommit}
              commitIndex={selectedCommitIdx}
              allCommits={commits}
              repoPath={repoPath}
              mailmap={mailmap}
              pendingChange={pendingChanges.get(selectedCommit.hash)}
              onAuthorChange={handleAuthorChange}
              onCommitEdit={handleCommitEdit}
            />
          )}
        </main>
      </div>
    </div>
  );
}
