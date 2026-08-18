# Concept: Event Delivery Planning

## Summary

- Each Time2Win event should be executable through a structured project plan.
- Plans should be created from reusable templates and monitored through dependencies, due dates, and critical-path visibility.
- The plan should be linked to a distinct event record in the event overview.

## Details

- A project will often represent one concrete event delivery engagement.
- The event record and the operational task plan are closely linked but not necessarily identical objects.
- New event projects should be instantiable from templates.
- Templates should contain recurring task groups such as bib numbers, registration, and timing.
- Event-management plans should preserve operational grouping such as timing, bib numbers, finance, and preparation.
- Tasks may depend on each other, and these dependencies should support a practical critical-path view.
- The system should surface overdue tasks, blocked tasks, and escalation candidates clearly.
- Tasks can be assigned to one internal user, one internal group, or one organizer-side contact depending on responsibility.
- Organizer-side deliverables, such as a bib design, should remain visible in the same operational plan as internal work.

## Modeling Implications

- Support project templates and task templates as first-class objects.
- Support task dependencies so the system can derive blocking relationships and urgency.
- Support assignment targets beyond internal employees alone.
- Keep one operational board where internal and external responsibilities are visible together.

## Proposed operational views

These are view projections over the same event and task data, not separate planning models:

- Event list: master index with search, filters, status, dates, organizer, contacts, TIME2WIN ID, and completeness.
- Month/calendar view: portfolio planning across events; useful for date collisions, missing dates, and rough capacity.
- Week view: primary preparation view for tasks and milestones across one or more events.
- Event-weekend view: compact event-day operating view with agenda, key contacts, critical tasks, handoffs, and open blockers.
- Gantt/timeline: event-detail planning view for task dependencies and critical path; more useful per event than as a global portfolio view.
- Optional task board: useful when task status and ownership become a first-class MVP concern; not required for the initial event CRM-only scope.

Recommended navigation: `Veranstaltungen > Liste | Kalender | Woche | Event-Wochenende`; place `Gantt/Plan` inside the event detail. Keep all views synchronized through the same filters and event/task records.

## Resource capacity view

The week view should also support resource rows, not only event rows. A day header should show the number of events, while rows can show vehicles, trailers, timing teams, printing capacity, or other scarce resources. Conflicts and over-capacity should be highlighted directly in the grid. This is especially important for vehicles because several events can overlap without being operationally feasible with the available fleet.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [organizer-account-model.md](organizer-account-model.md)
- [../phases.md](../phases.md)
- [../roadmap.md](../roadmap.md)
- [../sources/2026-06-15-user-event-operations-brief.md](../sources/2026-06-15-user-event-operations-brief.md)

## Evidence

- [../sources/2026-06-15-user-event-operations-brief.md](../sources/2026-06-15-user-event-operations-brief.md)
