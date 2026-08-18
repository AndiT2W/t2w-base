# Concept: Event Registry And Event Management

## Summary

- GCW Base should maintain a central event registry where each event is a managed operational object.
- Each event should link to its own event-management workflow containing the open tasks required to deliver that event.

## Details

- The current source material suggests one row per event in a central event overview.
- An event has both descriptive and operational metadata, including a business-facing event id.
- An event also links to a separate management structure through fields such as `VeranstaltungsMgmtId` and `Veranstaltungsmanagement`.
- This means the domain should distinguish between the event record itself and the operational task workflow attached to it.
- The detailed event-management export shows that the attached workflow is grouped into operational sections instead of being one flat undifferentiated list.

## Recommended Domain Shape

- `Event`: the core business record for one concrete event.
- `EventManagementPlan`: the operational task container linked to one event.
- `TaskGroup`: operational section such as timing, bib numbers, finance, or preparation.
- `EventTemplate`: a reusable setup for recurring event types or task groups.
- `TaskGroupTemplate`: reusable clusters such as registration, bib numbers, or timing.

## Typical Event Fields

- event id
- eventcode
- optional `t2w_event_id`
- event status
- organizer linkage
- start and end datetime
- location
- sport type
- optional technologies
- participant forecast
- structured address plus optional location notes
- organizer-side contact defaults and event overrides
- file links such as OneDrive and Eventfinance paths
- event notes and communication activities

## Operational Implications

- Users need one overview of all events with their key indicators.
- Users also need to drill into one event and immediately see its open operational tasks.
- The event overview should surface critical due items and not only static master data.
- Migration should preserve the current separation between event overview and event-management tasks, even if the target UX later presents them more seamlessly.
- The event should become the shared operational context not only for tasks but also for files, organizer-side contacts, and communication history.

## Related Pages

- [event-delivery-planning.md](event-delivery-planning.md)
- [organizer-account-model.md](organizer-account-model.md)
- [tool-consolidation-and-migration.md](tool-consolidation-and-migration.md)
- [../specification-v1.md](../specification-v1.md)
- [../sources/2026-06-15-veranstaltungen-xlsx.md](../sources/2026-06-15-veranstaltungen-xlsx.md)
- [../sources/2026-06-30-user-target-model-v1.md](../sources/2026-06-30-user-target-model-v1.md)

## Evidence

- [../sources/2026-06-15-veranstaltungen-xlsx.md](../sources/2026-06-15-veranstaltungen-xlsx.md)
- [../sources/2026-06-30-user-target-model-v1.md](../sources/2026-06-30-user-target-model-v1.md)
