# Source: User Finance Role Model 2026-06-29

## Metadata

- Date: 2026-06-29
- Type: user conversation
- Location: chat
- Status: active

## Summary

- The target system should be event-centered rather than customer-centered as the primary operational entry point.
- The finance model must distinguish at least between operational organizer, invoice recipient, and payout recipient.
- The same real-world organizer may appear through different legal or financial entities such as a person, an association, or a GmbH.

## Key Facts

- Each event should have one main organizer in the operational sense.
- Invoice recipients are often independent from the main organizer.
- Billing splits should be modeled as multiple separate invoices rather than one invoice with multiple payers.
- The same event may involve different legal entities for organizer, invoice, and payout purposes.
- Entry fees (`Nenngelder`) must be paid out to the organizer side.
- In practice, `Veranstalter` is often used in a broad sense and may refer to the person or actor behind multiple legal entities.
- The target scope should stay lean and should not introduce generic extra roles such as sponsor or free-form additional organizations in the first model.

## Implications For Project

- The CRM and finance model should distinguish between operational and financial roles.
- The system should not assume that organizer, invoice recipient, and payout recipient are the same legal entity.
- The initial event model should stay focused on the minimum needed finance roles instead of supporting arbitrary involved organizations.
- A dedicated payout flow is required in addition to outgoing invoices.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../concepts/organizer-account-model.md](../concepts/organizer-account-model.md)
- [2026-06-29-clickup-live-structure-review.md](2026-06-29-clickup-live-structure-review.md)
