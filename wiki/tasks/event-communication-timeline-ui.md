# Event Communication Timeline UI

> **Abgelöst am 19.09.2026.** Diese Seite beschreibt die frühere Oberfläche mit drei Timeline-Varianten, aufklappbarer Vorschau und Thread-Kontext-Aside. Sie ist Historie; verbindlich ist die [Anzeigegrundlage Kommunikation](../concepts/communication-display-design.md).

## Decision

The event communication tab presents synchronized Outlook messages and manual activities as a compact, date-grouped timeline rather than a flat card list.

## Interaction Model

- Filters separate all entries, e-mails, and manual activities.
- A local search matches subject, sender/recipient, and preview text.
- Long e-mail previews are collapsed by default and can be expanded in place.
- The compact, date-grouped list is the default view. It uses one-line previews, tighter vertical rhythm, and ellipsis for long subjects and addresses while preserving the full values through titles and in-place expansion.
- E-mail direction, channel, timestamp, attachment state, and Outlook deep link are visible without opening the message.
- E-mail addresses are matched against loaded CRM persons. A match is shown as a clickable contact badge that opens the matching person directly; otherwise the UI explicitly indicates that no contact is assigned.
- Existing event contacts receive a blue role badge and a matching timeline accent. Outgoing messages from the configured TIME2WIN mailbox receive the green product accent and a `TIME2WIN gesendet` marker.

## Evidence

- [`src/routes/events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx)
- [`tests/e2e/event-management.spec.ts`](../../tests/e2e/event-management.spec.ts)
