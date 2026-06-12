# GitModdy

GitModdy is a modern desktop application that allows you to easily rewrite your local Git commit history. Whether you need to fix a typo in your commit email, reassign commits to a different author, or consolidate multiple identities into one, GitModdy provides a safe, visual, and fast way to manage it all without memorizing complex Git commands.

## Features

- **Select Repository**: Easily browse and select any local Git repository.
- **Visual Identity Mapping**: The app automatically scans all commits and groups them by unique identities. You can edit existing identities or add completely new ones.
- **Commit Assignment**: Go through your commits and visually assign them to specific identities via a simple dropdown interface.
- **Dry Run Preview**: Preview exactly which commits will be altered before making any destructive changes.
- **Fast Execution**: Uses native Go bindings to efficiently invoke `git-filter-repo` and rewrite the commit history.

## Prerequisites

Before using GitModdy, ensure that you have the following installed on your system:

- **Git**
- **git-filter-repo**: This is the engine that powers the history rewrite.
  - Install via python: `pip install git-filter-repo`
  - macOS: `brew install git-filter-repo`
  - Linux: Your package manager usually provides `git-filter-repo`.
  - More info: [git-filter-repo repository](https://github.com/newren/git-filter-repo)

## Tech Stack

- **Backend**: [Wails](https://wails.io/) and Go
- **Frontend**: React, TypeScript, Vite, and Tailwind CSS v4
- **Icons**: Lucide React

## Development

To run GitModdy in live development mode with hot-reloading:

```bash
wails dev
```

## Building

To build a redistributable, production-ready package:

```bash
wails build
```

> **Warning:** GitModdy actively rewrites Git history. While `git-filter-repo` is incredibly safe and usually preserves original references, it is highly recommended to make a backup of your repository before performing history modifications. You will need to force push (`git push --force`) your changes to remote servers after rewriting.
