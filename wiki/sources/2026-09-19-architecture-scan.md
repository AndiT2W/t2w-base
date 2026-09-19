---
title: Architecture scan after planning and category changes
type: source
status: candidates-awaiting-selection
updated: 2026-09-19
---

# Architecture candidates at `81c694b3`

Source: user invocation of `improve-codebase-architecture`, 2026-09-19; source inspection at commit `81c694b3`, an independent PM explorer, and an isolated in-memory failure probe. These are proposals, not accepted architectural decisions. No application implementation changed.

## Scope and prior work

The last 80 commits span 2026-09-09 through 2026-09-19. File appearances in those commits include Event detail (28), Event list (16), global tasks (15), Event planning (14), and overview (13). Counts measure commit appearances, not defects or complexity. The review accounts for planning deepening in `c5df4141` and category appearance in `81c694b3`; it does not propose repeating the completed [task interaction/global projection work](../concepts/task-planning-and-table-deepening-2026-09-15.md).

## 1. Atomic successor creation — Strong, recommended first

- [Event planning](../../src/components/t2w/ProjectManagement.tsx), lines 191–197, coordinates task creation, dependency creation, then unconditional close. [Task entry](../../src/components/t2w/TaskCategory.tsx), lines 412–414, also closes the successor input after that callback resolves.
- [Task interaction workspace](../../src/lib/t2w/task-interaction-workspace.ts), lines 121–139, catches a failed mutation and returns `undefined`; lines 169–178 clear the error on close. [Planning persistence](../../services/event-service/src/project-management.service.ts), lines 173–186 and 254–284, processes creation and dependency changes as separate commands/transactions.
- An isolated Node probe loaded the existing TypeScript workspace, used its in-memory adapter, injected an `addDependency` rejection, and repeated the caller's create/link/close sequence. Observed: one retained task, `Injected dependency conflict` before close, `null` error after close. This demonstrates the workspace/caller failure path; it is not a browser or database reproduction.
- Proposal: deepen the existing planning module around atomic successor creation, with task, dependency and audit in one persistence change and an explicit outcome. Preserve scope checks, graph versions and `affectedTaskId`. A function that merely groups the existing calls would only move complexity.
- [Existing workspace tests](../../src/lib/t2w/task-interaction-workspace.test.ts) cover editing, stale history and attachments. The in-memory adapter does not persist dependency edges. [Browser chain fixtures](../../tests/pm-e2e/project-management.spec.ts) construct dependencies through requests. A chosen implementation should drive “Nachfolger” in the browser and verify its edge after reload, plus a failed/conflicting intention with no partial task or hidden error.

## 2. Category draft/version recovery — Worth exploring

- [Category settings](../../src/components/t2w/PmCategorySettings.tsx), lines 29–56, captures a whole versioned group in the appearance draft while reload updates only `groups`. Lines 238–242 capture that group and 380–383 reuse it for saving. Name drafts use the current rendered group instead. Closing the appearance dialog discards its draft; the reload action sits outside the dialog.
- This is static evidence of different recovery protocols, not a reproduced browser failure. [The category browser regression](../../tests/pm-e2e/category-settings.spec.ts), lines 175–199, exercises name-conflict recovery; appearance coverage checks successful save and mobile layout.
- Proposal: a category editing module owns keyed drafts, current saved versions, reload/retry, serialized mutations and outcomes behind the existing persistence seam. A controlled test adapter would support failure cases. Preserve the recently extracted [category catalogue](../../services/event-service/src/project-management-catalogue.ts); no generic selection-list abstraction is justified by this scan.

## 3. Shared Event table behavior — Worth exploring

- [Overview](../../src/routes/index.tsx), lines 48–80 and 227–460, and [Event list](../../src/routes/veranstaltungen.tsx), lines 67–110 and 249–505, repeat column definitions, sort values, headers, cells and links. Day-count expressions differ; the scan established no production-data discrepancy.
- Proposal: deepen Event table presentation around the shared column/cell behavior while retaining the existing [DataTable](../../src/components/t2w/DataTable.tsx), route-owned filters, separate preference identifiers, collision decoration and [mobile Event list](../../src/components/t2w/EventMobileList.tsx). Removing that module should restore substantial duplication across both real callers; sharing constants alone would provide less depth.
- [Browser tests](../../tests/e2e/event-management.spec.ts) cover both routes' TIME2WIN column order/links; [Excel coverage](../../tests/e2e/table-preferences.spec.ts) targets the overview. Carry these workflows through a shared presentation test surface and cover both exports.

## Constraints and verification

All candidates fit [ADR-0001](../../docs/adr/0001-deepen-crm-event-and-table-workspaces.md), [ADR-0002](../../docs/adr/0002-canonical-event-and-global-tasks.md), [ADR-0003](../../docs/adr/0003-shared-compact-data-tables.md), and the [PM design foundation](../concepts/project-management-design.md). No interface design or implementation was selected. Gantt extraction was considered but omitted because its immediate leverage is weaker than these candidates.

The visual report is an ephemeral `architecture-review-<timestamp>.html` in the Windows temp directory; this page preserves the evidence independently. The report was checked with headless Chromium at desktop and 390 px, including Mermaid rendering. No application test suite was run for this review.
