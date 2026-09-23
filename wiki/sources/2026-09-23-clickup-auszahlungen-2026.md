# ClickUp-Auszahlungen 2026 (2026-09-23)

## Source

- ClickUp list: [AUSZAHLUNGEN](https://app.clickup.com/9015316130/v/li/901502561876)
- Workspace: TIME2WIN (`9015316130`)
- Raw snapshot is retained in the local `raw/clickup/` intake and is intentionally not committed because it contains payout-level financial data.
- The review workbook is retained in the local task output and is intentionally not committed as a binary source artifact.

## Scope

- Captured 2026-09-23 through the ClickUp connector.
- 2026 scope uses the established payout-number convention `T26xxxx`; subtasks were excluded and closed tasks included.
- 320 payout tasks matched the scope. Statuses: 305 `ausbezahlt`, 14 `erstellt`, 1 `gesendet`.
- 154 unique ClickUp events are referenced; 312 payout tasks have a primary event relationship. One task has multiple event relationships.

## Fields captured

Each task was read with its ClickUp ID, payout number, status, timestamps, amount, currency, transfer date, transaction attachment, comment, task URL and `Veranstaltung` relationship. Event mappings retain the ClickUp event ID, event name, event dates, URL and a derived target event-code candidate.

## Review findings

- 5 tasks have no payout amount.
- 8 tasks have no event relationship.
- 35 rows are marked `REVIEW` in the workbook; this includes missing amounts/event links and event-year deviations.
- Some `T26` payout tasks point to events in 2027, 2025 or 2024. These are retained and flagged rather than silently excluded.
- Only 27 tasks contain an explicit ClickUp transfer date. For paid tasks without one, the current importer uses `Aktualisiert am` as the `paidAt` fallback; this is visible in the workbook notes.

## Import/resync mapping

The workbook keeps `clickUpId` as the idempotency key and stores a separate event-mapping table. `Ziel-Event-ID` and `Ziel-Payout-ID` remain blank until the database preview/productive import resolves them. No database import was run from this source.
