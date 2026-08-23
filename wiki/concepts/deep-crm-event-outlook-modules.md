# Deep CRM, Event Workspace, and Outlook Modules

Updated: 2026-08-23

## Current architecture

- The CRM module exposes one Person/Kunde domain interface with two real adapters. The deployed HTTP adapter uses the protected `/api/v1/contacts` and `/api/v1/organizers` endpoints; the local demo adapter persists the same domain records in `localStorage`.
- The deployed HTTP adapter is the default. `VITE_CRM_ADAPTER=local` explicitly selects the local demo adapter; adapters never fall back to one another.
- CRM mutations are pessimistic: visible state changes only after the selected adapter confirms persistence. The HTTP adapter stores Person–Kunde links in `OrganizerContact`; the local adapter maintains the same reciprocal relationship invariant.
- The Event workspace module owns date normalization, asynchronous save outcomes, version-conflict reporting, and Outlook synchronization. Routes no longer call the transport adapter directly.
- The Outlook Event-folder module owns the `year folder / quarter / Eventcode` plan, drift detection, mapping resolution, folder creation, and sync status persistence.

## Test seams

- `src/lib/crm/module.ts`: shared CRM interface and deployed HTTP adapter.
- `src/lib/crm/local-adapter.ts`: persistent local demo adapter implementing the same interface.
- `src/lib/t2w/event-workspace.ts`: saved, conflict, failed, synced, and folder-plan outcomes.
- `services/event-service/src/outlook/outlook.folder.service.ts`: canonical folder planning plus the existing Microsoft Graph adapter seam.
- `tests/e2e/event-management.spec.ts`: browser workflow verifies CRM persistence after reload and Event/Outlook behavior.

## Evidence

- [CRM module implementation](../../src/lib/crm/module.ts)
- [Local CRM adapter](../../src/lib/crm/local-adapter.ts)
- [Event workspace implementation](../../src/lib/t2w/event-workspace.ts)
- [Outlook folder implementation](../../services/event-service/src/outlook/outlook.folder.service.ts)
- [Person, Kundenprofil und Eventrollen decision](../decisions/2026-08-21-person-kundenprofil-und-eventrollen.md)
- User conversation on 2026-08-23 first removed demo persistence, then explicitly requested restoring it behind the same domain interface as a second real adapter. Pessimistic mutations remain required.
