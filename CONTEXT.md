# Domain Context

## CRM workspace

The CRM workspace manages people, customer profiles, and their independent relationships. A person may have customer associations and event roles simultaneously. Removing a customer association preserves the person and any event roles.

## Event workspace

The Event workspace owns event participant and recipient rules: organizer assignment, payout recipients, invoice recipients, contact roles, deletion eligibility, defaults, and optimistic-concurrency behavior. Multi-relationship commands are atomic. Referenced organizers are not deleted; they may be deactivated.

## Table preferences

Table behavior consists of generic column definitions, persisted visibility, locale-aware sorting, stable ordering, and preference recovery. Domain-specific filtering remains owned by the containing workspace. Browser storage is an adapter, not part of the table behavior’s core interface.

## Selection lists

A selection list is a centrally managed set of domain-named values offered as choices in Event workflows. Values can be activated or deactivated without rewriting existing Event data. Active values are available for selection; management views also include inactive values. Sport types and Event roles are selection lists.

## Architectural vocabulary

- Framework-free domain behavior shared by browser and backend lives in the `@t2w/domain` workspace package. React, HTTP, local persistence, Nest, and Prisma remain adapters at seams.
- A workspace module presents a small intent-level interface and returns refreshed domain state.
- HTTP, local persistence, database, and browser storage are adapters behind seams.
- Tests cross the module interface; persistence and storage adapters are replaceable in tests.
