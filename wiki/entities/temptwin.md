# Entity: Temptwin

## Summary

- Temptwin is the organization for which this software is being designed.
- The target product is GCW Base, an integrated CRM, project management, invoicing, and operations platform.

## Key Facts

- The current project intent is documented from user conversation on 2026-06-15.
- The organization needs support for both customer-facing and delivery-facing workflows.
- The primary customer type is an event organizer with multiple associated contacts.
- Individual Time2Win events should be run through repeatable project plans with templates and dependency tracking.
- Current operations are distributed across a Zendooin backend, ClickUp, and `n8n`.
- The initial focus is on specification, phase planning, and roadmap design.

## Relationships

- Product scope is defined in [../specification-v1.md](../specification-v1.md).
- The target system itself is described in [gcw-base.md](gcw-base.md).
- Customer structure is further described in [../concepts/organizer-account-model.md](../concepts/organizer-account-model.md).
- Delivery sequencing is defined in [../phases.md](../phases.md) and [../roadmap.md](../roadmap.md).
- Primary evidence is [../sources/2026-06-15-user-product-brief.md](../sources/2026-06-15-user-product-brief.md).

## Evidence

- User conversation dated 2026-06-15.
- User clarification on organizer-centric customer model dated 2026-06-15.
- User description of current tool landscape dated 2026-06-15.

## Open Questions

- What exact business workflows does Temptwin run today?
- Which user groups should be included in the first rollout?
- Are there existing tools, spreadsheets, or databases that must be migrated?
- Are organizer contact roles global, project-specific, or event-specific in the first usable release?
- How should external organizer-side assignees interact with the system in MVP v1?
- Which parts of current ClickUp and `n8n` behavior must be matched in the first rollout?
