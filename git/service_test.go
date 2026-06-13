package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// ─── parseStatSummary ────────────────────────────────────────────────────────

func TestParseStatSummary(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		wantFiles int
		wantIns   int
		wantDel   int
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

// initTestRepo creates a minimal git repository with two commits in dir.
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

	// First commit
	f := filepath.Join(dir, "hello.txt")
	if err := os.WriteFile(f, []byte("hello\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	must("add", ".")
	must("commit", "-m", "initial commit")

	// Second commit — modify the file so --stat produces a non-empty summary line
	if err := os.WriteFile(f, []byte("hello\nworld\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	must("add", ".")
	must("commit", "-m", "add world")
}

// initMultiCommitRepo creates a git repository with N commits.
func initMultiCommitRepo(t *testing.T, dir string, n int) {
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

	for i := 1; i <= n; i++ {
		f := filepath.Join(dir, "file.txt")
		if err := os.WriteFile(f, []byte(string(rune(i))), 0o644); err != nil {
			t.Fatal(err)
		}
		must("add", ".")
		must("commit", "-m", "commit number "+string(rune('0'+i)))
	}
}

// ─── GetAuthors ─────────────────────────────────────────────────────────────

func TestGetAuthors_NotARepo(t *testing.T) {
	svc := &Service{}
	dir := t.TempDir() // valid dir but not a git repo
	_, err := svc.GetAuthors(dir)
	if err == nil {
		t.Fatal("expected error for non-git directory, got nil")
	}
}

func TestGetAuthors_ValidRepo(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &Service{}
	result, err := svc.GetAuthors(dir)
	if err != nil {
		t.Fatalf("GetAuthors failed: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil AuthorsResult")
	}
	if len(result.Mailmap) == 0 {
		t.Error("expected at least one mailmap entry")
	}
	if result.Mailmap[1].Name != "Test User" || result.Mailmap[1].Email != "test@example.com" {
		t.Errorf("unexpected mailmap entry: %+v", result.Mailmap[1])
	}
}

// ─── FetchCommitPage ─────────────────────────────────────────────────────────

func TestFetchCommitPage_Pagination(t *testing.T) {
	dir := t.TempDir()
	initMultiCommitRepo(t, dir, 5)

	svc := &Service{}

	// Page 1 (limit 2)
	p1, err := svc.FetchCommitPage(dir, "", 2)
	if err != nil {
		t.Fatalf("FetchCommitPage page 1 failed: %v", err)
	}
	if len(p1.Commits) != 2 {
		t.Fatalf("expected 2 commits in page 1, got %d", len(p1.Commits))
	}
	if p1.NextCursor == "" {
		t.Fatal("expected NextCursor not to be empty")
	}

	// Page 2 (limit 2)
	p2, err := svc.FetchCommitPage(dir, p1.NextCursor, 2)
	if err != nil {
		t.Fatalf("FetchCommitPage page 2 failed: %v", err)
	}
	if len(p2.Commits) != 2 {
		t.Fatalf("expected 2 commits in page 2, got %d", len(p2.Commits))
	}
	if p2.NextCursor == "" {
		t.Fatal("expected NextCursor not to be empty")
	}

	// Page 3 (limit 2)
	p3, err := svc.FetchCommitPage(dir, p2.NextCursor, 2)
	if err != nil {
		t.Fatalf("FetchCommitPage page 3 failed: %v", err)
	}
	if len(p3.Commits) != 1 {
		t.Fatalf("expected 1 commit in page 3, got %d", len(p3.Commits))
	}
	if p3.NextCursor != "" {
		t.Fatalf("expected empty NextCursor at the end of history, got %q", p3.NextCursor)
	}
}

// ─── GetCommitDetail ─────────────────────────────────────────────────────────

func TestGetCommitDetail_BadHash(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &Service{}
	_, err := svc.GetCommitDetail(dir, "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef")
	if err == nil {
		t.Fatal("expected error for nonexistent hash, got nil")
	}
}

func TestGetCommitDetail_ValidHash(t *testing.T) {
	dir := t.TempDir()
	initTestRepo(t, dir)

	svc := &Service{}
	result, err := svc.FetchCommitPage(dir, "", 10)
	if err != nil {
		t.Fatalf("FetchCommitPage: %v", err)
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
	if detail.Title != "add world" {
		t.Errorf("unexpected title: %q", detail.Title)
	}
	if detail.AuthorName == "" {
		t.Error("authorName must not be empty")
	}
	if detail.AuthorEmail == "" {
		t.Error("authorEmail must not be empty")
	}
	if detail.FilesChanged < 1 {
		t.Errorf("expected filesChanged >= 1, got %d", detail.FilesChanged)
	}
}

func TestCheckFilterRepo(t *testing.T) {
	svc := &Service{}
	_ = svc.CheckFilterRepo()
}

func TestGetAppVersion(t *testing.T) {
	svc := &Service{Version: "1.2.3"}
	v := svc.GetAppVersion()
	if v != "1.2.3" {
		t.Errorf("expected version 1.2.3, got %s", v)
	}
}
