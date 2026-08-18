# Decision: GCW Base Replaces The Current Multi-Tool Workflow

## Status

- Accepted

## Context

- The current operations use multiple tools, including a Zendooin backend, ClickUp for event tasks and invoice tracking, and `n8n` for automation such as reminder emails.
- The user stated that GCW Base should represent this functionality as the new tool.

## Decision

- Define GCW Base as the target system for consolidating CRM, event project management, invoicing, and at least the most important operational automations.
- Treat current-tool replacement and migration as part of the product scope.
- Keep the architecture open for staged migration and selective integration where full replacement is not practical immediately.

## Consequences

- Discovery must document existing tools and workflows in more detail.
- Invoicing and reminder workflows are more important than previously assumed.
- Roadmap planning must include migration sequencing, not only new feature development.

## Evidence

- [../sources/2026-06-15-user-current-tooling-landscape.md](../sources/2026-06-15-user-current-tooling-landscape.md)
