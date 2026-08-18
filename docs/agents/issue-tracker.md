# Issue tracker: GitHub

Issues and specs for this repo live as GitHub Issues in `AndiT2W/t2w-base`. Use the `gh` CLI for tracker operations.

## Conventions

- Create an issue with `gh issue create`.
- Read an issue with `gh issue view <number> --comments`.
- List issues with `gh issue list` and filter by labels/state.
- Comment with `gh issue comment <number>`.
- Add/remove labels with `gh issue edit <number> --add-label` / `--remove-label`.
- Close with `gh issue close <number>`.

Infer the repository from the Git remote when operating inside this clone.

## Pull requests as a triage surface

PRs as a request surface: no. Triage issues only unless this setting is deliberately changed later.

## When a skill says "publish to the issue tracker"

Create or update a GitHub Issue in `AndiT2W/t2w-base`.
