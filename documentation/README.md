# Welcome to the Thesis Repository

This repository contains the codebase and supporting materials for the thesis project. It hosts the web application, reusable skills/utilities, and this documentation set.

## Folder Routes & Descriptions

| Path | Description |
|---|---|
| `/CLAUDE.md` | Root git workflow rules and repository-wide instructions for Claude Code. |
| `/documentation` | Project documentation (this folder) — guides, notes, and reference material for the repository. |
| `/.claude/skills` | Claude Code skills for this project — this is the path Claude Code actually scans to make a skill available as a `/` slash command, so any new skill goes here, not under a top-level `/skills`. |
| `/.claude/skills/thesis-topic-assessment` | Skill that scores a candidate thesis topic against a 5-criteria rubric and gives concrete fixes for any gaps. |
| `/web-app` | Container for web application(s) built as part of the thesis. |
| `/web-app/thesis-web-application` | The main Next.js web application. |


## Notes

- `documentation` is currently empty aside from this file and will grow as the thesis project develops.
- Update this index whenever new top-level folders are added so it stays an accurate map of the repository.
