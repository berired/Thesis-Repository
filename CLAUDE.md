# Git Workflow Rules

- Never create a pull request automatically. Only open a PR when the developer explicitly asks for one.
- Never push directly to `main`. All pushes go to `stage` (or a feature branch based on `stage`); PRs into `main` must be created explicitly by request, never automatically.
- Before starting new work, always remind the developer to pull the latest changes from `stage` first.
- Whenever the developer merges `stage` into `main` (or asks for a PR into `main`), always remind them to also apply the new Prisma migrations to the production Neon branch (`main`, `br-bitter-water-a1rschti`), ideally before or at the production deploy. Deploys do not run migrations, and `stage` uses its own Neon branch.
