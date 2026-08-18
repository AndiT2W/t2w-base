# LLM Wiki Schema

This repository uses a Karpathy-style LLM wiki: raw project material is stored immutably, and the wiki is a compiled knowledge layer maintained by the agent in Markdown.

## Purpose

The wiki exists to accumulate project knowledge over time instead of rediscovering it in every chat. The agent should update the wiki whenever new information appears in the repo, in a conversation, or in an imported source.

## Directory Layout

- `raw/`: immutable source material and intake area.
- `wiki/`: maintained knowledge base.
- `wiki/index.md`: top-level navigation.
- `wiki/overview.md`: current project summary for fast onboarding.
- `wiki/log.md`: chronological maintenance log.
- `wiki/sources/`: one page per ingested source or evidence item.
- `wiki/entities/`: concrete things such as systems, services, people, environments, APIs, or files of special importance.
- `wiki/concepts/`: important ideas, workflows, conventions, and domain knowledge.
- `wiki/decisions/`: durable architectural or product decisions.
- `wiki/tasks/`: optional durable work notes when a task produces reusable project context.
- `wiki/_templates/`: starter templates for new wiki pages.

## Operating Rules

1. Treat `raw/` as the source of truth. Do not edit files there unless explicitly asked by the user.
2. Treat `wiki/` as agent-owned. Create and update pages freely to keep the knowledge base coherent.
3. Prefer many small linked pages over a few giant notes.
4. Every durable claim in the wiki should point to evidence:
   - link the relevant repo file, or
   - link a page in `wiki/sources/`, or
   - note that the claim came from user conversation with a date.
5. Preserve contradictions explicitly. Do not silently overwrite competing claims; record the conflict and what still needs verification.
6. Keep prose compact and factual. The wiki is for retrieval and maintenance, not polished marketing copy.
7. When a page is superseded, mark it clearly and link the replacement instead of deleting useful history.

## Standard Workflows

### Ingest a new source

When the user adds a document, transcript, spec, or other source:

1. Save or locate the source under `raw/`.
2. Create or update a page in `wiki/sources/`.
3. Update relevant entity, concept, and decision pages.
4. Update `wiki/overview.md` if the project state meaningfully changed.
5. Append a dated note to `wiki/log.md`.

### Answer a project question

1. Read `wiki/index.md` and the most relevant linked pages first.
2. Use repo files and raw sources to verify any stale or uncertain claims.
3. If the answer creates durable knowledge, file it back into the wiki.

### After implementation work

When code or docs change in a way that matters later:

1. Update the affected wiki pages.
2. Record any new decision, dependency, workflow, risk, or open question.
3. Add a log entry if the change is meaningful for future sessions.

## Page Conventions

### Frontmatter

Frontmatter is optional. Use it when it improves filtering or structure. Preferred keys:

- `title`
- `type`
- `status`
- `updated`
- `sources`

### Linking

- Use relative Markdown links inside the wiki.
- Link generously between related pages.
- Create index pages when a section grows beyond a handful of pages.

### Naming

- Use lowercase kebab-case filenames.
- Keep names stable once linked broadly.

## Maintenance Heuristics

- Favor updating existing pages over creating near-duplicates.
- Split a page when it mixes distinct topics.
- Merge pages when they drift into redundancy.
- Flag staleness plainly with a short note instead of guessing.
- Keep `wiki/overview.md` readable in one screenful when possible.

## First-Session Defaults

Until the project has more material:

- use `wiki/overview.md` as the main briefing note,
- track incoming material in `raw/inbox/`,
- capture reusable findings in `wiki/concepts/` and `wiki/decisions/`,
- use `wiki/log.md` as the session memory spine.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for `AndiT2W/t2w-base`; use `gh` for tracker operations. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default Matt Pocock triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository; domain context and ADRs are read from the repository root and `docs/adr/`. See `docs/agents/domain.md`.
