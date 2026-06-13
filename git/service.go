package git

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Service handles your repository modifications in Wails v3
type Service struct {
	Version string
}

func (s *Service) SelectRepository() (string, error) {
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

// GetBranches returns all local and remote branch names for the repo
func (s *Service) GetBranches(repoPath string) ([]string, error) {
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

// GetAppVersion returns the current version of GitModdy.
func (s *Service) GetAppVersion() string {
	return s.Version
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
