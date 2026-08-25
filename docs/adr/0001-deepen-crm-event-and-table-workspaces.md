# ADR-0001: Deepen CRM, event, and table workspace modules

## Status

Accepted — 2026-08-25

## Context

Recent CRM, event, and table features concentrated behavior in routes and controllers. Their interfaces expose state representations, transport details, or presentation concerns, reducing locality and making behavior harder to test through a stable seam.

## Decision

- Deepen the CRM workspace around intent-level operations and snapshot-oriented results. Keep HTTP and local persistence as adapters.
- Deepen the Event workspace around atomic participant and recipient commands, including role changes, deletion eligibility, defaults, and version conflicts.
- Deepen the table module around pure column, sorting, stable-ordering, and preference-recovery behavior. Keep domain filtering in the containing workspace and browser storage behind an adapter.
- Preserve people and event roles when a customer association is removed. Reject deletion of referenced organizers while permitting deactivation.

## Consequences

Routes and controllers become thinner. Domain behavior becomes testable without React, Nest, Prisma, or browser storage. Adapter seams become more valuable because HTTP/local/database/storage implementations can share the same module interface. The initial refactor will touch CRM, event, and table tests and should retain browser E2E coverage for persistence-visible workflows.
