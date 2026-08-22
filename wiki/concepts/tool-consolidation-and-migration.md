# Concept: Tool Consolidation And Migration

## Summary

- GCW Base is intended to replace a fragmented operational setup.
- The current landscape includes a Zendooin backend, ClickUp for tasks and invoice tracking, and `n8n` for automation such as reminder emails.

## Details

- The project is not starting from zero business process knowledge; it is inheriting workflows from existing tools.
- ClickUp currently acts as both an event-operations board and a lightweight invoice/open-invoice tracker.
- Live ClickUp inspection on 2026-06-29 shows that ClickUp also already holds CRM-like master data in separate `KUNDEN` and `KONTAKTE` lists.
- The inspected `VERANSTALTUNGEN.xlsx` export shows that ClickUp currently also acts as a central event registry with event ids and linked management references.
- The current ClickUp structure is partly normalized but still inconsistent: event records reference customer-side entities, while customer and contact lists contain duplicates and mixed entity types.
- `n8n` currently automates at least part of the reminder or dunning flow.
- The future system should reduce context switching and make these workflows visible in one place.

## Migration Implications

- Inventory the current ClickUp structures, statuses, automations, and fields before implementation.
- Plan explicit cleanup rules for duplicate customers, non-person contacts, and ambiguous billing-recipient records before migration.
- The saved ClickUp event import workbook `outputs/clickup-import/t2w-events-import.xlsx` is not yet sufficient for role-linked migration: `Rechnungsempfänger` has no populated event values, `Auszahlungsempfänger` is free text, and the populated relationship fields contain display text plus ClickUp URLs rather than stable target identifiers. The workbook also contains repeated export-header rows and visible encoding damage (`�`) in German text. Import preparation therefore needs normalized customer records plus an event-role mapping keyed by stable IDs.
- Preserve the relationship between the event overview rows and the linked event-management structures.
- Clarify what remains in the Zendooin backend and what should move into GCW Base.
- Decide whether `n8n` remains an integration layer or whether critical automations move into the application itself.
- Treat migration and replacement as product requirements, not only technical cleanup.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [event-delivery-planning.md](event-delivery-planning.md)
- [../phases.md](../phases.md)
- [../roadmap.md](../roadmap.md)
- [../sources/2026-06-15-user-current-tooling-landscape.md](../sources/2026-06-15-user-current-tooling-landscape.md)
- [../sources/2026-06-29-clickup-live-structure-review.md](../sources/2026-06-29-clickup-live-structure-review.md)

## Evidence

- [../sources/2026-06-15-user-current-tooling-landscape.md](../sources/2026-06-15-user-current-tooling-landscape.md)
- [../sources/2026-06-29-clickup-live-structure-review.md](../sources/2026-06-29-clickup-live-structure-review.md)
