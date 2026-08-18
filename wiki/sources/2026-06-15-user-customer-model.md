# Source: User Customer Model Brief 2026-06-15

## Metadata

- Date: 2026-06-15
- Type: user conversation
- Location: chat
- Status: active

## Summary

- A key part of the project is collecting and processing customer data.
- The project should therefore contain a CRM system or CRM-like capability.
- In this domain, the customer is the event organizer.
- One organizer consists of several people with different roles for the event.

## Key Facts

- The primary customer type is an organizer, not a generic account in the abstract.
- A customer organization must support multiple linked contacts.
- Contacts have role-specific responsibilities in the context of an event or engagement.
- CRM requirements must reflect stakeholder structure, not just flat contact storage.

## Implications For Project

- The CRM model must support organization-to-many-contacts relationships.
- The system should store both contact data and contextual role assignments.
- Sales, handoff, and project delivery should be able to identify the right organizer stakeholders quickly.
- The specification should treat organizer contact roles as a first-class requirement.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../concepts/organizer-account-model.md](../concepts/organizer-account-model.md)
- [../entities/temptwin.md](../entities/temptwin.md)
