# Git Workflow Rules

- Never create a pull request automatically. Only open a PR when the developer explicitly asks for one.
- Never push directly to `main`. All pushes go to `stage` (or a feature branch based on `stage`); PRs into `main` must be created explicitly by request, never automatically.
- Before starting new work, always remind the developer to pull the latest changes from `stage` first.
