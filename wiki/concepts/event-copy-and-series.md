# Event Copy and Series

Issue #38 defines copying as a reusable Event-template operation, not an implicit recurrence engine. A copy carries operational master data (organizer, sport, recipients, contact roles, forecast, status, notes) but starts without TIME2WIN, external-folder, task, file, activity, or communication state.

The backend performs copying as one transaction. An optional `seriesId` groups intentionally linked copies; Event detail derives chronologically adjacent Events from that group. Without the option, the copied Event has no series identifier or visible relationship.

Series can also be maintained after creation from Event detail. The current Event is always included and the user selects any number of additional Events in one searchable multi-select. Existing members are preselected; saving assigns the current selection one shared series ID in a single transaction and detaches former members that were explicitly deselected. Selecting an Event from another series moves that selected Event only, without silently merging its former series. An Event can also be removed from its series without changing operational or external data.

Event detail orders series members by start date and shows the directly previous and next Events as labeled, keyboard-accessible badges above the workspace.

Evidence: [GitHub issue #38](https://github.com/AndiT2W/t2w-base/issues/38), [`event-mutations.ts`](../../services/event-service/src/event-mutations.ts), [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx), [browser regression](../../tests/e2e/event-management.spec.ts), and migration [`0016_event_series`](../../services/event-service/prisma/migrations/0016_event_series/migration.sql).
