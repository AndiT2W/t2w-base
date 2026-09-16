# ADR-0003: Shared compact data tables

## Status

Accepted — 2026-09-14

## Context

TIME2WIN contains operational lists in several workspaces. They had separate table markup, inconsistent density, and local-only column preferences. The user selected a ClickUp-like dense desktop rhythm while retaining readable mobile representations.

## Decision

- Use the shared `DataTable` module for new and migrated operational lists. Its desktop contract is a 30 px header, 34 px rows, 13 px cell text, single-line truncation, compact 11 px status tags, semantic hover and a visible keyboard focus treatment.
- Keep mobile event lists as cards. Detail tables may horizontally scroll rather than losing fields.
- Keep sorting, safe column recovery, visibility and optional column order behind `table-model.ts`; routes own their domain filters and cell content.
- Store a versioned table view per authenticated user and table identifier via `GET/PUT /api/v1/table-preferences/:tableId`. Browser `localStorage` remains a one-time fallback/migration source when no server value exists.
- Inline editing remains an explicit workspace decision. The shared table primitive never saves on focus changes.
- Every rendered data table uses `DataTable` with a required export name. Its Excel export serializes the current visible table state to `.xlsx` and omits selection and action columns.

## Consequences

The visual, keyboard, and export contract has one implementation point. Column settings follow a signed-in user across devices, malformed or obsolete saved columns are ignored safely, and routes can migrate incrementally without a second preference format. A new `DataTable` cannot compile without naming its Excel export.
