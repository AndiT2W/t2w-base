# Event Communication Timeline UI

## Decision

The event communication tab presents synchronized Outlook messages and manual activities as a compact, date-grouped timeline rather than a flat card list.

## Interaction Model

- Filters separate all entries, e-mails, and manual activities.
- A local search matches subject, sender/recipient, and preview text.
- Long e-mail previews are collapsed by default and can be expanded in place.
- E-mail direction, channel, timestamp, attachment state, and Outlook deep link are visible without opening the message.
- E-mail addresses are matched against loaded CRM persons. A match is shown as a clickable contact badge that opens the matching person directly; otherwise the UI explicitly indicates that no contact is assigned.
- Existing event contacts receive a blue role badge and a matching timeline accent. Outgoing messages from the configured TIME2WIN mailbox receive the green product accent and a `TIME2WIN gesendet` marker.

## Evidence

- [`src/routes/events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx)
- [`tests/e2e/event-management.spec.ts`](../../tests/e2e/event-management.spec.ts)
