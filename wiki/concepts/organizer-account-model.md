# Concept: Organizer Account Model

## Summary

- In the Temptwin domain, the customer is typically an event organizer.
- An organizer can be an organization or an individual person, with multiple associated contacts where needed.

## Details

- The CRM should model the organizer as the customer account.
- Each organizer can have multiple contacts.
- Each contact may have one or more roles, such as decision maker, operational contact, finance contact, on-site coordinator, or marketing contact.
- Some roles may be stable at the organizer level, while others may depend on a specific event, project, or sales opportunity.
- Handoffs from CRM into project execution should preserve which person is relevant for which responsibility.
- Organizer contacts may also become task assignees for external deliverables inside a project plan.
- The operational organizer is not always the same as the legal or financial entity used for invoicing or payout.
- `Nenngeld` payouts introduce a second financial direction: money must also be paid out to the organizer side, not only billed outward.
- Contacts are primarily real people, but they may carry additional functional mail addresses used in current operations.

## Modeling Implications

- Avoid a flat customer record with only one primary contact.
- Support many-to-one relationships between contacts and organizer accounts.
- Support role assignments that can be queried and filtered.
- Keep open whether role assignments belong directly to the customer account or to a separate event-level object in later phases.
- Distinguish between operational organizer, default invoice recipient, and default payout recipient.
- Allow contacts to exist without an organizer and to be linked directly to events where needed.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../phases.md](../phases.md)
- [../roadmap.md](../roadmap.md)
- [../sources/2026-06-15-user-customer-model.md](../sources/2026-06-15-user-customer-model.md)
- [../sources/2026-06-29-user-finance-role-model.md](../sources/2026-06-29-user-finance-role-model.md)
- [../sources/2026-06-30-user-target-model-v1.md](../sources/2026-06-30-user-target-model-v1.md)

## Evidence

- [../sources/2026-06-15-user-customer-model.md](../sources/2026-06-15-user-customer-model.md)
- [../sources/2026-06-29-user-finance-role-model.md](../sources/2026-06-29-user-finance-role-model.md)
- [../sources/2026-06-30-user-target-model-v1.md](../sources/2026-06-30-user-target-model-v1.md)
