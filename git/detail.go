package git

import (
	"fmt"
	"strings"
)

// GetCommitDetail returns full metadata and diff for a single commit
func (s *Service) GetCommitDetail(repoPath, hash string) (*CommitDetail, error) {
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

	// Parse stat summary using diff-tree (more reliable than `show --stat --no-patch`)
	stat, _ := runGit(repoPath, "diff-tree", "--stat", "--no-commit-id", hash)
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
