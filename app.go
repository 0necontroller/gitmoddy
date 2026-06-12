package main

import (
	"context"
	"fmt"
	"os/exec"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Identity represents an author's name and email
type Identity struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Commit represents a single git commit
type Commit struct {
	Hash           string   `json:"hash"`
	Title          string   `json:"title"`
	OriginalAuthor Identity `json:"originalAuthor"`
	Committer      int      `json:"committer"`
}

// ScanResult contains the commits and unique authors found
type ScanResult struct {
	Commits []Commit         `json:"commits"`
	Mailmap map[int]Identity `json:"mailmap"`
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectRepository opens a dialog to select a directory
func (a *App) SelectRepository() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Git Repository",
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// runGit runs a git command in the specified directory
func runGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %s", strings.Join(args, " "), string(out))
	}
	return strings.TrimSpace(string(out)), nil
}

func currentIdentity(dir string) Identity {
	name, _ := runGit(dir, "config", "user.name")
	email, _ := runGit(dir, "config", "user.email")
	return Identity{Name: name, Email: email}
}

// ScanRepository scans a git repo and returns commits and a mailmap
func (a *App) ScanRepository(path string) (*ScanResult, error) {
	sep := "\x1f"
	raw, err := runGit(path, "log", "--all", "--reverse", fmt.Sprintf("--format=%%H%s%%an%s%%ae%s%%s", sep, sep, sep))
	if err != nil {
		return nil, err
	}

	if raw == "" {
		return nil, fmt.Errorf("no commits found")
	}

	self := currentIdentity(path)
	slotMap := make(map[string]int)
	slotMap[fmt.Sprintf("%s%s%s", self.Name, sep, self.Email)] = 1
	nextSlot := 2

	mailmap := make(map[int]Identity)
	mailmap[1] = self

	var commits []Commit

	lines := strings.Split(raw, "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, sep, 4)
		if len(parts) < 4 {
			continue
		}
		hash := parts[0]
		authorName := parts[1]
		authorEmail := parts[2]
		title := parts[3]

		key := fmt.Sprintf("%s%s%s", authorName, sep, authorEmail)
		slot, exists := slotMap[key]
		if !exists {
			slot = nextSlot
			slotMap[key] = slot
			mailmap[slot] = Identity{Name: authorName, Email: authorEmail}
			nextSlot++
		}

		commits = append(commits, Commit{
			Hash:           hash,
			Title:          title,
			OriginalAuthor: Identity{Name: authorName, Email: authorEmail},
			Committer:      slot,
		})
	}

	return &ScanResult{
		Commits: commits,
		Mailmap: mailmap,
	}, nil
}

// RewriteHistory rewrites the git history using git-filter-repo
func (a *App) RewriteHistory(repoPath string, overrides map[string]Identity) error {
	if len(overrides) == 0 {
		return nil
	}

	var dictEntries []string
	for hash, id := range overrides {
		name := strings.ReplaceAll(id.Name, "\\", "\\\\")
		name = strings.ReplaceAll(name, "'", "\\'")
		email := strings.ReplaceAll(id.Email, "\\", "\\\\")
		email = strings.ReplaceAll(email, "'", "\\'")
		dictEntries = append(dictEntries, fmt.Sprintf("  b'%s': (b'%s', b'%s'),", hash, name, email))
	}

	callbackBody := []string{
		"overrides = {",
		strings.Join(dictEntries, "\n"),
		"}",
		"entry = overrides.get(commit.original_id)",
		"if entry:",
		"  name, email = entry",
		"  commit.author_name     = name",
		"  commit.author_email    = email",
		"  commit.committer_name  = name",
		"  commit.committer_email = email",
	}

	cmd := exec.Command("git", "filter-repo", "--commit-callback", strings.Join(callbackBody, "\n"), "--force")
	cmd.Dir = repoPath
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git-filter-repo failed: %s", string(out))
	}

	return nil
}
