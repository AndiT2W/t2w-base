# Event Detail Interactions

The Event-detail interaction module owns outcomes for saving an Event and synchronizing Outlook folders, TIME2WIN participants, and Outlook messages. Its `execute` interface returns a consistent success, conflict, or failure outcome with a user-facing message; routes are presentation adapters that render that outcome.

CRM master data reload remains optional and occurs only after a successful save.

Evidence: [`event-detail-workspace.ts`](../../src/lib/t2w/event-detail-workspace.ts), [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx), and ADR-0001.
