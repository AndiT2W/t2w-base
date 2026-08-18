# Concept: Event Management Task Model

## Summary

- Each event should have a dedicated operational task plan.
- The current event-management export shows that this plan is grouped into domain-specific sections and not managed as an undifferentiated backlog.

## Details

- One event-management list belongs to one event.
- The current example is structured into sections such as `Timing`, `Startnummern`, `Finanz`, and `Vorbereitung`.
- Each section contains concrete operational tasks with status, assignee, due date, and optional detailed instructions.
- Some tasks also include linked subtasks or richer textual content.
- The section label is currently also reflected in a field called `Type`.

## Recommended Domain Shape

- `EventManagementPlan`: one per event.
- `TaskGroup`: section inside the event-management plan.
- `Task`: actionable item belonging to one task group.
- `TaskTemplate`: reusable task definition.
- `TaskGroupTemplate`: reusable section or cluster of tasks.

## Recommended Task Properties

- title
- status
- assignee or assignees
- due date
- start date
- description or work instructions
- group or section
- linked subtasks
- preparation-hours estimate
- preparation-required flag

## Operational Implications

- The UI should show both a grouped view and a deadline-oriented view.
- Teams should be able to answer both of these questions quickly:
  - which area of the event still has open work?
  - which concrete tasks are overdue or in progress?
- Templates should not only generate tasks but also preserve the section structure of the plan.

## Related Pages

- [event-delivery-planning.md](event-delivery-planning.md)
- [event-registry-and-management.md](event-registry-and-management.md)
- [../specification-v1.md](../specification-v1.md)
- [../sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md](../sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md)

## Evidence

- [../sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md](../sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md)
