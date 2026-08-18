# Source: User Current Tooling Landscape 2026-06-15

## Metadata

- Date: 2026-06-15
- Type: user conversation
- Location: chat
- Status: active

## Summary

- The current operating landscape uses multiple tools.
- A Zendooin backend is currently in use.
- ClickUp is used to define tasks for events.
- ClickUp is also used for invoices and open invoices.
- `n8n` is connected for automation such as sending reminder or dunning emails automatically.
- The new tool, GCW Base, should cover this functionality.

## Key Facts

- The project is a consolidation effort, not just a greenfield product.
- ClickUp currently covers both operational planning and billing follow-up.
- Automation is already part of the current business process.
- Replacing or subsuming the current tooling stack is part of the product direction.

## Implications For Project

- The specification should include current-system replacement as an explicit goal.
- The roadmap should include system inventory, migration planning, and automation replacement.
- Billing support must cover open-invoice tracking and reminder workflows.
- The architecture should keep room for either native automation or continued integration with `n8n`.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../concepts/tool-consolidation-and-migration.md](../concepts/tool-consolidation-and-migration.md)
- [../entities/gcw-base.md](../entities/gcw-base.md)
