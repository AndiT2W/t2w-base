# Event Detail Interactions

The Event-detail interaction module owns outcomes for saving an Event and synchronizing Outlook folders, TIME2WIN participants, and Outlook messages. Its `execute` interface returns a consistent success, conflict, or failure outcome with a user-facing message; routes are presentation adapters that render that outcome.

CRM master data reload remains optional and occurs only after a successful save.

The TIME2WIN Event ID is editable in Event master data and persists through the normal Event save interaction. The TIME2WIN tab remains the view for linked-event details and synchronization. See [the 2026-09-15 decision](../decisions/2026-09-15-time2win-event-id-in-stammdaten.md) and the [browser regression](../../tests/e2e/event-management.spec.ts).

Evidence: [`event-detail-workspace.ts`](../../src/lib/t2w/event-detail-workspace.ts), [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx), and ADR-0001.
