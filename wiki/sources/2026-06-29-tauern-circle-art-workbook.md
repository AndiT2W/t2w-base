# Source: Tauern Circle ART Workbook 2026-06-29

## Metadata

- Date: 2026-06-29
- Type: spreadsheet workbook
- Location: `D:\TIME2WIN\EVENTFINANCE - Dokumente\2026_Eventfinance\01_zeitnehmung\260627_tauern_circle\260225_ART_tauern_circle.xlsx`
- Status: inspected

## Summary

- The workbook is a combined offer, invoice, pricing, customer, and calculation template for one event.
- The structure is clearly position-based rather than only document-based.
- Offer and invoice sheets reuse a shared service catalog and event/customer data.

## Workbook Structure

- Observed sheets:
  - `ANGEBOT`
  - `RECHNUNG`
  - `LEISTUNGEN`
  - `ANGEBOT_APP`
  - `RECHNUNG_APP`
  - `PAYKOSTEN`
  - `PRICELIST`
  - `DATEN`
  - `KUNDE`
  - `INFO`
  - `KALKUATION`

## Key Observations

- `ANGEBOT` and `RECHNUNG` use almost the same line-item structure with columns such as `POS`, `ARTNR`, `BESCHREIBUNG`, `MENGE`, and `PREIS`.
- Both documents pull values from shared sheets such as `LEISTUNGEN` and `DATEN`.
- The workbook already separates customer master data, event data, and pricing logic.
- `KUNDE` contains customer master data such as customer number, organization name, contact person, IBAN, address, and mail.
- `DATEN` contains event-specific data and selection fields such as customer number, event name, date, UID, tax rate, payment mode, and transponder type.
- `LEISTUNGEN` acts like a service catalog plus calculation layer.
- `KALKUATION` contains price formulas driven by participant counts.
- The workbook already distinguishes offer number and invoice number:
  - observed offer number format like `260225001`
  - observed invoice number format like `260116`

## Implications For Project

- The future CRM and billing system should model offers and invoices with reusable line items.
- Shared master data and event data should feed documents instead of being retyped per file.
- Pricing logic may need both stored line items and calculated values based on event variables such as participant count.
- The system should support event-specific document variants like app-related offers and invoices.

## Related Pages

- [../overview.md](../overview.md)
- [../specification-v1.md](../specification-v1.md)
- [../concepts/tool-consolidation-and-migration.md](../concepts/tool-consolidation-and-migration.md)
