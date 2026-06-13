package git

import (
	"fmt"
	"strings"
)

// buildMailmapAndSlotMap builds a consistent mailmap and name/email -> slot map.
func (s *Service) buildMailmapAndSlotMap(path string) (map[string]int, map[int]Identity, error) {
	// Check if this is indeed a git repository first.
	if _, err := runGit(path, "rev-parse", "--is-inside-work-tree"); err != nil {
		return nil, nil, fmt.Errorf("not a git repository (or any of the parent directories): %w", err)
	}

	sep := "\x1f"
	// Fetch all author name/email pairs from oldest to newest to ensure slot stability
	raw, err := runGit(path, "log", "--all", "--reverse", fmt.Sprintf("--format=%%an%s%%ae", sep))
	if err != nil {
		// If there are no commits yet or if it fails, return empty maps
		self := currentIdentity(path)
		slotMap := make(map[string]int)
		slotMap[fmt.Sprintf("%s%s%s", self.Name, sep, self.Email)] = 1
		mailmap := make(map[int]Identity)
		mailmap[1] = self
		return slotMap, mailmap, nil
	}

	self := currentIdentity(path)
	slotMap := make(map[string]int)
	slotMap[fmt.Sprintf("%s%s%s", self.Name, sep, self.Email)] = 1
	nextSlot := 2

	mailmap := make(map[int]Identity)
	mailmap[1] = self

	if raw == "" {
		return slotMap, mailmap, nil
	}

	lines := strings.Split(raw, "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, sep, 2)
		if len(parts) < 2 {
			continue
		}
		authorName := parts[0]
		authorEmail := parts[1]

		key := fmt.Sprintf("%s%s%s", authorName, sep, authorEmail)
		if _, exists := slotMap[key]; !exists {
			slotMap[key] = nextSlot
			mailmap[nextSlot] = Identity{Name: authorName, Email: authorEmail}
			nextSlot++
		}
	}

	return slotMap, mailmap, nil
}

// GetAuthors fetches the complete list of unique authors (mailmap).
func (s *Service) GetAuthors(path string) (*AuthorsResult, error) {
	_, mailmap, err := s.buildMailmapAndSlotMap(path)
	if err != nil {
		return nil, err
	}
	return &AuthorsResult{Mailmap: mailmap}, nil
}

// FetchCommitPage fetches a page of commits (newest first).
// If cursor is empty, starts from HEAD (all branches).
// Otherwise, starts after the cursor commit.
func (s *Service) FetchCommitPage(path, cursor string, limit int) (*CommitPage, error) {
	sep := "\x1f"
	var raw string
	var err error

	formatStr := fmt.Sprintf("--format=%%H%s%%an%s%%ae%s%%s%s%%ai", sep, sep, sep, sep)

	if cursor == "" {
		// First page: start at HEADs of all branches
		raw, err = runGit(path, "log", "--all", fmt.Sprintf("--max-count=%d", limit), formatStr)
	} else {
		// Subsequent pages: walk from the cursor, skipping the cursor commit itself
		raw, err = runGit(path, "log", cursor, fmt.Sprintf("--max-count=%d", limit), "--skip=1", formatStr)
	}

	if err != nil {
		// If command fails because of no commits or invalid revision
		return &CommitPage{Commits: []Commit{}, NextCursor: ""}, nil
	}

	slotMap, mailmap, err := s.buildMailmapAndSlotMap(path)
	if err != nil {
		return nil, err
	}
	nextSlot := len(mailmap) + 1

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

	nextCursor := ""
	if len(commits) == limit {
		// Set next cursor as the last commit in the current batch
		nextCursor = commits[len(commits)-1].Hash
	}

	return &CommitPage{
		Commits:    commits,
		NextCursor: nextCursor,
	}, nil
}
