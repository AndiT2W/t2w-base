# Event Copy and Series

Issue #38 defines copying as a reusable Event-template operation, not an implicit recurrence engine. A copy carries operational master data (organizer, sport, recipients, contact roles, forecast, status, notes) but starts without TIME2WIN, external-folder, task, file, activity, or communication state.

The backend performs copying as one transaction. An optional `seriesId` groups intentionally linked copies; Event detail derives chronologically adjacent Events from that group. Without the option, the copied Event has no series identifier or visible relationship.

Series can also be maintained after creation from Event detail. A user selects another existing Event and the service assigns both to its series in one transaction (creating a series ID when needed). Moving an Event changes only that Event's relationship; it deliberately does not merge two existing series. An Event can be removed from its series without changing operational or external data.

Evidence: [GitHub issue #38](https://github.com/AndiT2W/t2w-base/issues/38), [`event-mutations.ts`](../../services/event-service/src/event-mutations.ts), and migration [`0016_event_series`](../../services/event-service/prisma/migrations/0016_event_series/migration.sql).
