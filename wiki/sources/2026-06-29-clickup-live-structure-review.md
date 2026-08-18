# Source: ClickUp Live Structure Review 2026-06-29

## Metadata

- Date: 2026-06-29
- Type: live workspace inspection
- Location: ClickUp workspace `TIME2WIN`
- Status: inspected

## Summary

- The live ClickUp workspace already contains separate lists for `KUNDEN`, `KONTAKTE`, and `RECHNUNGEN` in the `TIME2WIN` space.
- Event execution is handled separately in the `VERANSTALTUNGSMANAGEMENT` space, where each event has its own list.
- The existing structure confirms that CRM, invoicing, and event delivery are already partially separated in ClickUp, but the data model is still list-based rather than strongly relational.

## Observed Workspace Structure

- Space `TIME2WIN`
  - Folder `Office`
    - List `VERANSTALTUNGEN`
    - List `KUNDEN`
    - List `KONTAKTE`
  - Folder `Finanzen`
    - List `RECHNUNGEN`
- Space `VERANSTALTUNGSMANAGEMENT`
  - one list per concrete event, for example `260620_traunsee_halbmarathon_2026`

## Observed Record Volumes

- `KUNDEN`: 78 tasks returned by ClickUp search on 2026-06-29.
- `KONTAKTE`: 80 tasks returned by ClickUp search on 2026-06-29.
- `RECHNUNGEN`: 59 tasks returned by ClickUp search on 2026-06-29.

## Key Observations

- `KUNDEN` appears to represent organizer or customer organizations as one task per organization.
- `KONTAKTE` appears to represent people or contact endpoints as one task per contact.
- `RECHNUNGEN` appears to represent invoice records, usually named by invoice number such as `260116`.
- `RECHNUNGEN` has workflow statuses oriented around billing progression:
  - `erstellt`
  - `gesendet`
  - `inkasso`
  - `mail senden`
  - `bezahlt`
- `KUNDEN` has account-like statuses:
  - `aktiv`
  - `inaktiv`
- `VERANSTALTUNGEN` already contains relationship-oriented fields in the inspected export, including:
  - `Kunde`
  - `Organisator`
  - `Rechnungsempfänger`
  - `Veranstalter`
- Event-management lists still contain concrete finance tasks such as `Rechnung erstellen`, so the billing process is split between finance records and event checklists.

## Data Quality Notes

- The current CRM-like lists contain likely inconsistencies or mixed entity types.
- `KUNDEN` includes at least one person-like record (`Reinhard Gossner`), which may indicate account/contact mixing.
- `KUNDEN` includes a visible duplicate pattern for `inovent gmbh`, once `aktiv` and once `inaktiv`.
- `KONTAKTE` includes several records that do not clearly look like natural persons, for example `UPS Rechnungscenter`, `Unzer SUPPORT`, `Led Clock`, and `Verbinden`.
- This suggests the current contact layer mixes people, departments, vendors, support channels, or freeform placeholders.

## Implications For Project

- The future CRM does not need to invent the organizer/customer concept from scratch; there is already a customer master list in ClickUp.
- Migration work should explicitly separate:
  - organizer accounts
  - person contacts
  - billing recipients
  - generic service or support endpoints
- The data model should preserve the current event links to customer-side entities, but the migration will need cleanup and normalization before it can be treated as a reliable CRM source of truth.

## Related Pages

- [../overview.md](../overview.md)
- [../concepts/organizer-account-model.md](../concepts/organizer-account-model.md)
- [../concepts/tool-consolidation-and-migration.md](../concepts/tool-consolidation-and-migration.md)
- [2026-06-15-veranstaltungen-xlsx.md](2026-06-15-veranstaltungen-xlsx.md)
