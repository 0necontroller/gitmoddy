// Shared TypeScript interfaces for GitModdy.
// These mirror the Go structs in gitService.go and are used throughout
// the frontend instead of relying on auto-generated binding types directly.

export interface Identity {
  name: string;
  email: string;
}

export interface Commit {
  hash: string;
  title: string;
  originalAuthor: Identity;
  committer: number;
  date: string; // ISO 8601 from git %ai
}

export interface ScanResult {
  commits: Commit[];
  mailmap: Record<number, Identity>;
}

export interface CommitDetail {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  title: string;
  body: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  diff: string;
}

/** A set of changes pending for a single commit. Only set fields will be written. */
export interface PendingChange {
  newAuthor?: Identity;
  newTitle?: string;
  newDate?: string;
}

export type AppView = 'repo-select' | 'main' | 'dry-run' | 'apply';
