import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SelectRepository, ScanRepository, CheckFilterRepo } from '../../bindings/changeme/gitservice';
import { Identity, Commit, PendingChange, AppView } from '../types';

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

// ── Context value shape ───────────────────────────────────────────────────────
export interface AppContextValue {
  // State
  view: AppView;
  repoPath: string;
  repoName: string;
  repoLoaded: boolean;
  commits: Commit[];
  mailmap: Record<number, Identity>;
  recentRepos: string[];
  isLoading: boolean;
  error: string | null;
  selectedCommit: Commit | null;
  selectedCommitIdx: number;
  pendingChanges: Map<string, PendingChange>;
  synced: boolean;
  filterRepoInstalled: boolean | null;

  // Navigation
  setView: (v: AppView) => void;
  setSynced: (synced: boolean) => void;

  // Repo actions
  openRepo: (path: string) => Promise<void>;
  handleBrowse: () => Promise<void>;
  removeRecentRepo: (path: string) => void;

  // Commit actions
  selectCommit: (commit: Commit, idx: number) => void;
  handleAuthorChange: (slot: number) => void;
  handleCommitEdit: (change: PendingChange) => void;
  handleAddContributor: (identity: Identity) => void;

  // Lifecycle
  handleComplete: () => void;
  checkFilterRepoInstalled: () => Promise<void>;
}

// ── Context + hook ────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within <AppProvider>');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
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
  const [filterRepoInstalled, setFilterRepoInstalled] = useState<boolean | null>(null);

  const checkFilterRepoInstalled = async () => {
    try {
      const installed = await CheckFilterRepo();
      setFilterRepoInstalled(installed);
    } catch {
      setFilterRepoInstalled(false);
    }
  };

  useEffect(() => {
    checkFilterRepoInstalled();
  }, []);

  const repoName = repoPath
    ? (repoPath.split('/').filter(Boolean).pop() ?? repoPath)
    : '';

  const repoLoaded = !!repoPath;

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
      setRecentRepos((prev) => {
        const updated = [path, ...prev.filter((r) => r !== path)].slice(0, 10);
        saveRecentRepos(updated);
        return updated;
      });

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

  // ── Remove a recent repo from the list ───────────────────────────────────
  const removeRecentRepo = (path: string) => {
    setRecentRepos((prev) => {
      const updated = prev.filter((r) => r !== path);
      saveRecentRepos(updated);
      return updated;
    });
  };

  // ── Select a commit ───────────────────────────────────────────────────────
  const selectCommit = (commit: Commit, idx: number) => {
    setSelectedCommit(commit);
    setSelectedCommitIdx(idx);
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

  const value: AppContextValue = {
    view,
    repoPath,
    repoName,
    repoLoaded,
    commits,
    mailmap,
    recentRepos,
    isLoading,
    error,
    selectedCommit,
    selectedCommitIdx,
    pendingChanges,
    synced,
    filterRepoInstalled,
    setView,
    setSynced,
    openRepo,
    handleBrowse,
    removeRecentRepo,
    selectCommit,
    handleAuthorChange,
    handleCommitEdit,
    handleAddContributor,
    handleComplete,
    checkFilterRepoInstalled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
