---
title: Locale rendering module
type: concept
status: active
updated: 2026-08-22
sources:
  - ../../src/lib/i18n.tsx
  - ../../src/components/t2w/PageHeader.tsx
  - ../../src/routes/index.tsx
  - ../../tests/e2e/language.spec.ts
---

# Locale rendering module

The UI uses `useI18n().t` for typed translation keys and `useI18n().text` for legacy route copy while visible routes are migrated. `text` is the explicit rendering seam; it does not mutate already-rendered DOM nodes.

The former `MutationObserver` translation pass was removed on 2026-08-22. This concentrates fallback lookup and locale selection in `src/lib/i18n.tsx`, improving locality and making the interface testable through rendered output.

The migration is intentionally incremental: remaining route literals should be converted to typed keys or `text()` at their next touch. The language E2E suite is the regression guard.
