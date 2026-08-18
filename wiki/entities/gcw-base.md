# Entity: GCW Base

## Summary

- GCW Base is the working name of the new internal tool being specified in this repository.
- It is intended to consolidate CRM, project management, invoicing, and operational automation that are currently split across several tools.

## Key Facts

- GCW Base should serve Temptwin and Time2Win operations.
- It should absorb or replace workflows currently handled in ClickUp.
- It should cover invoice and open-invoice tracking currently handled with ClickUp and `n8n`.
- It should include a central event overview and linked event-management workflows.
- It may need to integrate with or replace parts of the current Zendooin backend.

## Relationships

- Product scope is defined in [../specification-v1.md](../specification-v1.md).
- Migration context is described in [../concepts/tool-consolidation-and-migration.md](../concepts/tool-consolidation-and-migration.md).
- Event workflow planning is described in [../concepts/event-delivery-planning.md](../concepts/event-delivery-planning.md).

## Evidence

- [../sources/2026-06-15-user-current-tooling-landscape.md](../sources/2026-06-15-user-current-tooling-landscape.md)

## Open Questions

- Which parts of Zendooin are authoritative and must remain external?
- Which ClickUp lists, fields, and automations are essential for day-one replacement?
- Should the MVP expose `Event` and `EventManagementPlan` as separate objects or one unified workflow view?
- Should `n8n` remain part of the target architecture or be reduced over time?
