# Event Copy and Series

Issue #38 defines copying as a reusable Event-template operation, not an implicit recurrence engine. A copy carries operational master data (organizer, sport, recipients, contact roles, forecast, status, notes) but starts without TIME2WIN, external-folder, task, file, activity, or communication state.

The backend performs this as one transaction. An optional `seriesId` groups intentionally linked copies; Event detail derives chronologically adjacent Events from that group. Without the option, the copied Event has no series identifier or visible relationship.

Evidence: [GitHub issue #38](https://github.com/AndiT2W/t2w-base/issues/38), [`event-mutations.ts`](../../services/event-service/src/event-mutations.ts), and migration [`0016_event_series`](../../services/event-service/prisma/migrations/0016_event_series/migration.sql).
