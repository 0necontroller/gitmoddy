import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router";
import {
  SelectRepository,
  CheckFilterRepo,
  GetAuthors,
  FetchCommitPage,
} from "../../bindings/changeme/git/service";
import { Identity, Commit, PendingChange, AppView } from "../types";

// ── Recent repos persistence ──────────────────────────────────────────────────
const RECENT_KEY = "gitmoddy_recent_repos";

function loadRecentRepos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
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
  prevCommitDate: string | null;
  nextCommitDate: string | null;
  pendingChanges: Map<string, PendingChange>;
  synced: boolean;
  filterRepoInstalled: boolean | null;
  nextCursor: string;
  hasMore: boolean;
  isLoadingMore: boolean;

  // Navigation
  setView: (v: AppView) => void;
  setSynced: (synced: boolean) => void;

  // Repo actions
  openRepo: (path: string) => Promise<void>;
  handleBrowse: () => Promise<void>;
  removeRecentRepo: (path: string) => void;

  // Commit actions
  selectCommit: (commit: Commit | null) => void;
  handleAuthorChange: (slot: number) => void;
  handleCommitEdit: (change: PendingChange) => void;
  handleAddContributor: (identity: Identity) => void;
  loadMoreCommits: () => Promise<void>;

  // Lifecycle
  handleComplete: () => void;
  checkFilterRepoInstalled: () => Promise<void>;
}

// ── Context + hook ────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within <AppProvider>");
  }
  return ctx;
}

function beautifyError(errStr: string): string | null {
  let msg = errStr;
  try {
    const parsed = JSON.parse(errStr);
    if (parsed.message) {
      msg = parsed.message;
    }
  } catch {}

  if (
    msg.includes("user cancelled directory selection") ||
    msg.includes("cancelled")
  ) {
    return null;
  }
  if (msg.includes("not a git repository")) {
    return "The selected directory is not a Git repository. Please choose a directory with a valid Git configuration.";
  }
  return msg;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setViewInternal] = useState<AppView>("repo-select");
  const navigate = useNavigate();
  const location = useLocation();

  const setView = (v: AppView) => {
    setViewInternal(v);
    if (v === "repo-select") navigate("/");
    else if (v === "main") navigate("/repo");
    else if (v === "dry-run") navigate("/dry-run");
    else if (v === "apply") navigate("/apply");
  };

  useEffect(() => {
    if (location.pathname === "/") setViewInternal("repo-select");
    else if (location.pathname === "/repo") setViewInternal("main");
    else if (location.pathname === "/dry-run") setViewInternal("dry-run");
    else if (location.pathname === "/apply") setViewInternal("apply");
  }, [location.pathname]);

  const [repoPath, setRepoPath] = useState("");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [mailmap, setMailmap] = useState<Record<number, Identity>>({});
  const [recentRepos, setRecentRepos] = useState<string[]>(loadRecentRepos);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [prevCommitDate, setPrevCommitDate] = useState<string | null>(null);
  const [nextCommitDate, setNextCommitDate] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());
  const [synced, setSynced] = useState(false);
  const [filterRepoInstalled, setFilterRepoInstalled] = useState<
    boolean | null
  >(null);

  // Pagination states
  const [nextCursor, setNextCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Update adjacent commit constraints for Option A whenever the active selected commit or loaded commit window changes.
  useEffect(() => {
    if (!selectedCommit) {
      setPrevCommitDate(null);
      setNextCommitDate(null);
      return;
    }
    const idx = commits.findIndex((c) => c.hash === selectedCommit.hash);
    if (idx === -1) {
      setPrevCommitDate(null);
      setNextCommitDate(null);
      return;
    }
    // commits is sorted newest to oldest.
    // Index 0 is newest commit.
    // Chronologically previous (older in time) commit is at idx + 1
    // Chronologically next (newer in time) commit is at idx - 1
    const prevC = idx < commits.length - 1 ? commits[idx + 1] : null;
    const nextC = idx > 0 ? commits[idx - 1] : null;
    setPrevCommitDate(prevC ? prevC.date : null);
    setNextCommitDate(nextC ? nextC.date : null);
  }, [selectedCommit, commits]);

  const repoName = repoPath
    ? (repoPath.split("/").filter(Boolean).pop() ?? repoPath)
    : "";

  const repoLoaded = !!repoPath;

  // ── Open a repo by path ───────────────────────────────────────────────────
  const openRepo = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Concurrently fetch authors and first 50 commits (from HEAD)
      const [authorsResult, pageResult] = await Promise.all([
        GetAuthors(path),
        FetchCommitPage(path, "", 50),
      ]);

      if (
        !pageResult ||
        !pageResult.commits ||
        pageResult.commits.length === 0
      ) {
        throw new Error("No commits found in this repository.");
      }

      setRepoPath(path);
      setCommits(pageResult.commits);
      setNextCursor(pageResult.nextCursor);
      setHasMore(!!pageResult.nextCursor);
      setMailmap((authorsResult?.mailmap ?? {}) as unknown as Record<number, Identity>);
      setPendingChanges(new Map());
      setSelectedCommit(null);
      setSynced(false);

      // Persist to recent repos (most recent first, max 10)
      setRecentRepos((prev) => {
        const updated = [path, ...prev.filter((r) => r !== path)].slice(0, 10);
        saveRecentRepos(updated);
        return updated;
      });

      setView("main");
    } catch (err: unknown) {
      setError(beautifyError(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Load more commits (pagination) ────────────────────────────────────────
  const loadMoreCommits = async () => {
    if (isLoadingMore || !hasMore || !repoPath) return;
    setIsLoadingMore(true);
    try {
      const pageResult = await FetchCommitPage(repoPath, nextCursor, 50);
      if (pageResult && pageResult.commits) {
        setCommits((prev) => [...prev, ...pageResult.commits]);
        setNextCursor(pageResult.nextCursor);
        setHasMore(!!pageResult.nextCursor);
      }
    } catch (err) {
      console.error("Failed to load more commits:", err);
    } finally {
      setIsLoadingMore(false);
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
      setError(beautifyError(String(err)));
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
  const selectCommit = (commit: Commit | null) => {
    setSelectedCommit(commit);
  };

  // ── Pending changes helpers ───────────────────────────────────────────────
  const handleAuthorChange = (slot: number) => {
    if (!selectedCommit) return;
    const newAuthor = mailmap[slot];
    if (!newAuthor) return;
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(selectedCommit.hash, {
        ...(next.get(selectedCommit.hash) ?? {}),
        newAuthor,
      });
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
    setView("repo-select");
    setRepoPath("");
    setCommits([]);
    setNextCursor("");
    setHasMore(false);
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
    prevCommitDate,
    nextCommitDate,
    pendingChanges,
    synced,
    filterRepoInstalled,
    nextCursor,
    hasMore,
    isLoadingMore,
    setView,
    setSynced,
    openRepo,
    handleBrowse,
    removeRecentRepo,
    selectCommit,
    handleAuthorChange,
    handleCommitEdit,
    handleAddContributor,
    loadMoreCommits,
    handleComplete,
    checkFilterRepoInstalled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
