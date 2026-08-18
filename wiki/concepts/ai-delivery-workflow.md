# Concept: AI Delivery Workflow

## Summary

- The project should be specified so that later AI agents can implement it phase by phase.
- Work should move from product intent to epics, from epics to scoped tasks, and from tasks to verified code changes.

## Details

- Each roadmap phase should produce a bounded backlog with acceptance criteria.
- Each implementation task should reference one primary requirement and one verification method.
- Agents should prefer small vertical slices over broad unfinished scaffolding.
- After every completed slice, the wiki should be updated with new decisions, constraints, and operational knowledge.

## Recommended Execution Loop

1. Select one roadmap item.
2. Refine it into a short implementation brief with acceptance criteria.
3. Implement the smallest end-to-end slice that proves value.
4. Run checks, tests, or manual verification.
5. Update the wiki with durable findings.
6. Continue to the next slice only after the current slice is stable.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../phases.md](../phases.md)
- [../roadmap.md](../roadmap.md)

## Evidence

- [../sources/2026-06-15-user-product-brief.md](../sources/2026-06-15-user-product-brief.md)
