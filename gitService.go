// app.go
package main

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
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
	Date           string   `json:"date"` // ISO 8601 author date (%ai)
}

// ScanResult contains the commits and unique authors found
type ScanResult struct {
	Commits []Commit         `json:"commits"`
	Mailmap map[int]Identity `json:"mailmap"`
}

// CommitDetail holds the full metadata and diff for a single commit
type CommitDetail struct {
	Hash         string `json:"hash"`
	AuthorName   string `json:"authorName"`
	AuthorEmail  string `json:"authorEmail"`
	Date         string `json:"date"`
	Title        string `json:"title"`
	Body         string `json:"body"`
	FilesChanged int    `json:"filesChanged"`
	Insertions   int    `json:"insertions"`
	Deletions    int    `json:"deletions"`
	Diff         string `json:"diff"`
}

// GitService handles your repository modifications in Wails v3
type GitService struct{}

func (g *GitService) SelectRepository() (string, error) {
	window := application.Get().Window.Current()
	if window == nil {
		return "", fmt.Errorf("no active window found")
	}

	path, err := application.Get().Dialog.
		OpenFile().
		SetTitle("Select Git Repository").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		PromptForSingleSelection()

	if err != nil {
		return "", err
	}

	if path == "" {
		return "", fmt.Errorf("user cancelled directory selection")
	}

	return path, nil
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

// ScanRepository scans a git repo and returns commits (oldest→newest) and a mailmap
func (g *GitService) ScanRepository(path string) (*ScanResult, error) {
	sep := "\x1f"
	// format: hash, authorName, authorEmail, subject, authorDate (ISO 8601 strict)
	raw, err := runGit(path, "log", "--all", "--reverse",
		fmt.Sprintf("--format=%%H%s%%an%s%%ae%s%%s%s%%ai", sep, sep, sep, sep))
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
		parts := strings.SplitN(line, sep, 5)
		if len(parts) < 4 {
			continue
		}
		hash := parts[0]
		authorName := parts[1]
		authorEmail := parts[2]
		title := parts[3]
		date := ""
		if len(parts) == 5 {
			date = parts[4]
		}

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
			Date:           date,
		})
	}

	return &ScanResult{
		Commits: commits,
		Mailmap: mailmap,
	}, nil
}

// GetCommitDetail returns full metadata and diff for a single commit
func (g *GitService) GetCommitDetail(repoPath, hash string) (*CommitDetail, error) {
	sep := "\x1f"

	// Get metadata (no patch)
	meta, err := runGit(repoPath, "show", "--no-patch",
		fmt.Sprintf("--format=%%H%s%%an%s%%ae%s%%ai%s%%s%s%%b", sep, sep, sep, sep, sep),
		hash)
	if err != nil {
		return nil, err
	}

	parts := strings.SplitN(meta, sep, 6)
	if len(parts) < 5 {
		return nil, fmt.Errorf("unexpected git show output for %s", hash)
	}

	body := ""
	if len(parts) == 6 {
		body = strings.TrimSpace(parts[5])
	}

	// Get pure diff (no commit header) using diff-tree
	diff, _ := runGit(repoPath, "diff-tree", "--no-commit-id", "-p", "--unified=3", hash)

	// Parse stat summary
	stat, _ := runGit(repoPath, "show", "--stat", "--no-patch", "--format=", hash)
	filesChanged, insertions, deletions := parseStatSummary(stat)

	return &CommitDetail{
		Hash:         parts[0],
		AuthorName:   parts[1],
		AuthorEmail:  parts[2],
		Date:         parts[3],
		Title:        parts[4],
		Body:         body,
		FilesChanged: filesChanged,
		Insertions:   insertions,
		Deletions:    deletions,
		Diff:         diff,
	}, nil
}

// parseStatSummary extracts files/insertions/deletions from the last line of git --stat output
func parseStatSummary(stat string) (files, insertions, deletions int) {
	lines := strings.Split(stat, "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}
		// e.g. "3 files changed, 100 insertions(+), 20 deletions(-)"
		// or   "1 file changed, 5 insertions(+)"
		parts := strings.Split(line, ",")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			var n int
			if strings.Contains(p, "file") {
				fmt.Sscanf(p, "%d", &n)
				files = n
			} else if strings.Contains(p, "insertion") {
				fmt.Sscanf(p, "%d", &n)
				insertions = n
			} else if strings.Contains(p, "deletion") {
				fmt.Sscanf(p, "%d", &n)
				deletions = n
			}
		}
		break
	}
	return
}

// GetBranches returns all local and remote branch names for the repo
func (g *GitService) GetBranches(repoPath string) ([]string, error) {
	raw, err := runGit(repoPath, "branch", "--all", "--format=%(refname:short)")
	if err != nil {
		return nil, err
	}
	var branches []string
	for _, l := range strings.Split(raw, "\n") {
		l = strings.TrimSpace(l)
		if l != "" {
			branches = append(branches, l)
		}
	}
	return branches, nil
}

// RewriteHistory rewrites the git history using git-filter-repo
func (g *GitService) RewriteHistory(repoPath string, overrides map[string]Identity) error {
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

// Ensure strconv is used (suppress unused import if needed)
var _ = strconv.Itoa
