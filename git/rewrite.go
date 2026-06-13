package git

import (
	"fmt"
	"os/exec"
	"strings"
)

// RewriteHistory rewrites the git history using git-filter-repo
func (s *Service) RewriteHistory(repoPath string, overrides map[string]Identity) error {
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

// CheckFilterRepo checks if git-filter-repo is installed on the user's system.
func (s *Service) CheckFilterRepo() bool {
	_, err := exec.Command("git", "filter-repo", "--version").Output()
	return err == nil
}
