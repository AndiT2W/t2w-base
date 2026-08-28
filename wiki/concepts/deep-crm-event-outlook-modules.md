# Deep CRM, Event Workspace, and Outlook Modules

Updated: 2026-08-28

## Current architecture

- The CRM module exposes one Person/Kunde domain interface with two real adapters. The deployed HTTP adapter uses the protected `/api/v1/contacts` and `/api/v1/organizers` endpoints; the local demo adapter persists the same domain records in `localStorage`.
- The deployed HTTP adapter is the default. `VITE_CRM_ADAPTER=local` explicitly selects the local demo adapter; adapters never fall back to one another.
- Contact records persist `function` and `location` through the HTTP adapter and Event-Service; customer billing addresses use the existing `Organizer.address` field.
- CRM mutations are pessimistic and use one state-replacement protocol: after every confirmed mutation, the CRM workspace reloads and publishes the authoritative Person/Kunde snapshot. The HTTP adapter stores Person–Kunde links in `OrganizerContact`; the local adapter maintains the same reciprocal relationship invariant.
- The CRM workspace owns the authoritative Person/Kunde state and combined Person-plus-Kundenprofil transitions. `useCrm()` remains a compatibility interface; routes no longer coordinate multi-step mutations through stale React snapshots.
- The Event workspace module owns the authoritative Event collection plus pessimistic creation, date normalization, asynchronous save outcomes, version-conflict reporting, Outlook planning, and Outlook/TIME2WIN synchronization. The Event detail workspace owns both synchronization progress and user-facing outcomes; failed TIME2WIN refreshes preserve the last successful Event snapshot.
- TIME2WIN synchronization separates orchestration from the external-system adapter. The synchronization module owns scheduling, aggregation and persisted status; the HTTP adapter owns authentication, endpoint calls and tolerant upstream-response normalization.
- Event-role choices come from the Selection lists module. New assignments receive active roles; an inactive role remains available only where that role is already assigned.
- The Event projection module owns active/archive/time/status/sort rules and task projections used by overview, Event list, offers, invoices, tasks, calendar, and Gantt. Routes consume projections instead of maintaining competing interpretations.
- Backend Event creation and update invariants live in the Event mutation module. Organizer resolution, payout/invoice-recipient defaults, optimistic version checks, recipient replacement, and persistence execute through one transaction-oriented interface. The Nest controller is the HTTP adapter and Prisma is the production persistence adapter.
- The Outlook Event-folder module owns the `year folder / quarter / Eventcode` plan, drift detection, mapping resolution, folder creation, and sync status persistence.
- The event workspace persists event-contact roles, tasks, file/SharePoint references, and manual activities as explicit Event-Service resources. The event detail route uses those resource endpoints; they are not browser-only collections.

## Test seams

- `src/lib/crm/module.ts`: shared CRM interface and deployed HTTP adapter.
- `src/lib/crm/workspace.ts`: authoritative state and combined CRM transitions.
- `src/lib/crm/local-adapter.ts`: persistent local demo adapter implementing the same interface.
- `src/lib/t2w/event-workspace.ts`: saved, conflict, failed, synced, and folder-plan outcomes.
- `src/lib/t2w/event-projections.ts`: pure shared read-model projections for all Event views.
- `services/event-service/src/event-mutations.ts`: Event creation/update outcomes and invariants through an in-memory-testable persistence seam.
- `services/event-service/src/prisma-event-mutation.adapter.ts`: transaction-backed production adapter.
- `services/event-service/src/outlook/outlook.folder.service.ts`: canonical folder planning plus the existing Microsoft Graph adapter seam.
- `services/event-service/src/time2win.service.ts`: scheduled/manual synchronization, aggregation and persisted outcomes.
- `services/event-service/src/time2win.adapter.ts`: TIME2WIN HTTP/authentication and response-normalization adapter.
- `services/event-service/src/events.controller.ts`: event-workspace subresource endpoints for roles, tasks, files, and manual activities.
- `tests/e2e/event-management.spec.ts`: browser workflow verifies CRM persistence after reload and Event/Outlook behavior.

## Evidence

- [CRM module implementation](../../src/lib/crm/module.ts)
- [Local CRM adapter](../../src/lib/crm/local-adapter.ts)
- [Event workspace implementation](../../src/lib/t2w/event-workspace.ts)
- [Event mutation implementation](../../services/event-service/src/event-mutations.ts)
- [Prisma Event mutation adapter](../../services/event-service/src/prisma-event-mutation.adapter.ts)
- [Outlook folder implementation](../../services/event-service/src/outlook/outlook.folder.service.ts)
- [Person, Kundenprofil und Eventrollen decision](../decisions/2026-08-21-person-kundenprofil-und-eventrollen.md)
- User conversation on 2026-08-23 first removed demo persistence, then explicitly requested restoring it behind the same domain interface as a second real adapter. Pessimistic mutations remain required.
