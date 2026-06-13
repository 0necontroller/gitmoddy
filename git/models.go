package git

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

// AuthorsResult contains the mailmap constructed from scanning authors
type AuthorsResult struct {
	Mailmap map[int]Identity `json:"mailmap"`
}

// CommitPage represents a paginated chunk of commits
type CommitPage struct {
	Commits    []Commit `json:"commits"`
	NextCursor string   `json:"nextCursor"` // Empty string means no more pages
}
