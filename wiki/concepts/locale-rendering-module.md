---
title: Locale rendering module
type: concept
status: active
updated: 2026-08-23
sources:
  - ../../src/lib/i18n.tsx
  - ../../src/components/t2w/PageHeader.tsx
  - ../../src/routes/index.tsx
  - ../../tests/e2e/language.spec.ts
---

# Locale rendering module

The UI uses one `useI18n().t(value)` interface for translation keys and visible route copy. Callers no longer choose between keyed and legacy rendering; catalog fallback and compatibility lookup are implementation details of `createLocaleRenderer`.

The former `MutationObserver` translation pass was removed on 2026-08-22. This concentrates fallback lookup and locale selection in `src/lib/i18n.tsx`, improving locality and making the interface testable through rendered output.

Remaining route literals can be converted to stable keys incrementally without changing the caller interface. The locale-rendering unit tests and language E2E suite are the regression guards.
