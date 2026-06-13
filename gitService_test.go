package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// ─── parseStatSummary ────────────────────────────────────────────────────────

func TestParseStatSummary(t *testing.T) {
	tests := []struct {
		name       string
		input      string
		wantFiles  int
		wantIns    int
		wantDel    int
	}{
		{
			name:      "empty string",
			input:     "",
			wantFiles: 0, wantIns: 0, wantDel: 0,
		},
		{
			name:      "whitespace only",
			input:     "   \n  \n",
			wantFiles: 0, wantIns: 0, wantDel: 0,
		},
		{
			name:      "full stat line",
			input:     " 3 files changed, 100 insertions(+), 20 deletions(-)",
			wantFiles: 3, wantIns: 100, wantDel: 20,
		},
		{
			name:      "single file no deletions",
			input:     " 1 file changed, 5 insertions(+)",
			wantFiles: 1, wantIns: 5, wantDel: 0,
		},
		{
			name:      "insertions only plural",
			input:     " 2 files changed, 42 insertions(+)",
			wantFiles: 2, wantIns: 42, wantDel: 0,
		},
		{
			name:      "deletions only",
			input:     " 1 file changed, 7 deletions(-)",
			wantFiles: 1, wantIns: 0, wantDel: 7,
		},
		{
			name:      "multiline stat output — summary is last line",
			input:     " main.go | 10 +++++-----\n 1 file changed, 5 insertions(+), 5 deletions(-)",
			wantFiles: 1, wantIns: 5, wantDel: 5,
		},
		{
			name:      "large numbers",
			input:     " 99 files changed, 12345 insertions(+), 6789 deletions(-)",
			wantFiles: 99, wantIns: 12345, wantDel: 6789,
		},
		{
			name:      "unexpected format — no recognisable tokens",
			input:     "this is not a valid stat line",
			wantFiles: 0, wantIns: 0, wantDel: 0,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			f, ins, del := parseStatSummary(tc.input)
			if f != tc.wantFiles {
				t.Errorf("files: got %d, want %d", f, tc.wantFiles)
			}
			if ins != tc.wantIns {
				t.Errorf("insertions: got %d, want %d", ins, tc.wantIns)
			}
			if del != tc.wantDel {
				t.Errorf("deletions: got %d, want %d", del, tc.wantDel)
			}
		})
	}
}

// ─── runGit error path ───────────────────────────────────────────────────────

func TestRunGit_InvalidCommand(t *testing.T) {
	_, err := runGit(t.TempDir(), "this-subcommand-does-not-exist")
	if err == nil {
		t.Fatal("expected an error for an invalid git subcommand, got nil")
	}
}

func TestRunGit_BadDirectory(t *testing.T) {
	_, err := runGit("/nonexistent/path/that/cannot/exist", "status")
	if err == nil {
		t.Fatal("expected an error for a nonexistent directory, got nil")
	}
}

// ─── helpers for test fixtures ───────────────────────────────────────────────

// initTestRepo creates a minimal git repository with one commit in dir.
func initTestRepo(t *testing.T, dir string) {
	t.Helper()
	must := func(args ...string) {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		cmd.Env = append(os.Environ(),
			"GIT_AUTHOR_NAME=Test User",
			"GIT_AUTHOR_EMAIL=test@example.com",
			"GIT_COMMITTER_NAME=Test User",
			"GIT_COMMITTER_EMAIL=test@example.com",
		)
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %s", args, out)
		}
	}

	must("init")
	must("config", "user.email", "test@example.com")
	must("config", "user.name", "Test User")

	// Write a file and commit it.
	f := filepath.Join(dir, "hello.txt")
	if err := os.WriteFile(f, []byte("hello\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	must("add", ".")
	must("commit", "-m", "initial commit")
}

// ─── ScanRepository ─────────────────────────────────────────────────────────

func TestScanRepository_EmptyPath(t *testing.T) {
	svc := &GitService{}
	_, err := svc.ScanRepository("")
	if err == nil {
		t.Fatal("expected error for empty path, got nil")
	}
}

func TestScanRepository_NotARepo(t *testing.T) {
	svc := &GitService{}
	dir := t.TempDir() // valid dir but not a git repo
	_, err := svc.ScanRepository(dir)
	if err == nil {
		t.Fatal("expected error for non-git directory, got nil")
	}
}

func TestScanRepository_ValidRepo(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &GitService{}
	result, err := svc.ScanRepository(dir)
	if err != nil {
		t.Fatalf("ScanRepository failed: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil ScanResult")
	}
	if len(result.Commits) == 0 {
		t.Error("expected at least one commit")
	}
	if len(result.Mailmap) == 0 {
		t.Error("expected at least one mailmap entry")
	}

	// The single commit should reference slot 1 (the current user).
	c := result.Commits[0]
	if c.Committer != 1 {
		t.Errorf("expected committer slot 1, got %d", c.Committer)
	}
	if c.Title != "initial commit" {
		t.Errorf("unexpected title: %q", c.Title)
	}
}

func TestScanRepository_CommitFields(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &GitService{}
	result, err := svc.ScanRepository(dir)
	if err != nil {
		t.Fatalf("ScanRepository failed: %v", err)
	}

	c := result.Commits[0]
	if c.Hash == "" {
		t.Error("commit hash must not be empty")
	}
	if len(c.Hash) != 40 {
		t.Errorf("expected 40-char SHA1 hash, got %d chars", len(c.Hash))
	}
	if c.Date == "" {
		t.Error("commit date must not be empty")
	}
	if c.OriginalAuthor.Name == "" {
		t.Error("originalAuthor.name must not be empty")
	}
	if c.OriginalAuthor.Email == "" {
		t.Error("originalAuthor.email must not be empty")
	}
}

// ─── GetCommitDetail ─────────────────────────────────────────────────────────

func TestGetCommitDetail_BadHash(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &GitService{}
	_, err := svc.GetCommitDetail(dir, "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef")
	if err == nil {
		t.Fatal("expected error for nonexistent hash, got nil")
	}
}

func TestGetCommitDetail_ValidHash(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &GitService{}
	result, err := svc.ScanRepository(dir)
	if err != nil {
		t.Fatalf("ScanRepository: %v", err)
	}
	hash := result.Commits[0].Hash

	detail, err := svc.GetCommitDetail(dir, hash)
	if err != nil {
		t.Fatalf("GetCommitDetail failed: %v", err)
	}
	if detail == nil {
		t.Fatal("expected non-nil CommitDetail")
	}
	if detail.Hash != hash {
		t.Errorf("hash mismatch: got %s, want %s", detail.Hash, hash)
	}
	if detail.Title != "initial commit" {
		t.Errorf("unexpected title: %q", detail.Title)
	}
	if detail.AuthorName == "" {
		t.Error("authorName must not be empty")
	}
	if detail.AuthorEmail == "" {
		t.Error("authorEmail must not be empty")
	}
	// The initial commit touches hello.txt, so filesChanged should be >= 1
	if detail.FilesChanged < 1 {
		t.Errorf("expected filesChanged >= 1, got %d", detail.FilesChanged)
	}
}
