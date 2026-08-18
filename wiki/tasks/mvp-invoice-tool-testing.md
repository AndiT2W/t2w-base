# MVP Invoice Tool: Path To First Test

## Goal

Reach a locally testable workflow for creating an offer, converting it to an invoice, generating a ZUGFeRD PDF, and manually storing it in OneDrive.

## Scope For First Test

- One active issuing company
- Customers and optional events
- Products with `quantity x unit price`
- Offers from templates or copied offers
- Invoices from offers or manually
- Status flow: draft, issued, sent, partial, paid, cancelled
- German/English document text
- EUR, one tax rate per document
- ZUGFeRD 2.5 / EN 16931
- Manual OneDrive upload to a configured folder

## Implementation Order

The parent specification is tracked in [GitHub issue #1](https://github.com/AndiT2W/t2w-base/issues/1). It was split into these tracer-bullet tickets, published in dependency order:

1. [#2 Billing-Grundgerüst und erster Angebotsentwurf](https://github.com/AndiT2W/t2w-base/issues/2)
2. [#3 Kunden- und Eventauswahl](https://github.com/AndiT2W/t2w-base/issues/3) — blocked by #2
3. [#4 Angebotsvorlagen und Angebotskopien](https://github.com/AndiT2W/t2w-base/issues/4) — blocked by #3
4. [#5 Angebotsstatus und Angebotsaktionen](https://github.com/AndiT2W/t2w-base/issues/5) — blocked by #4
5. [#6 Rechnung aus Angebot oder manuell erstellen](https://github.com/AndiT2W/t2w-base/issues/6) — blocked by #5
6. [#7 Steuer, Rabatt und Rechnungs-PDF](https://github.com/AndiT2W/t2w-base/issues/7) — blocked by #6
7. [#8 ZUGFeRD und Zahlungs-QR-Code](https://github.com/AndiT2W/t2w-base/issues/8) — blocked by #7
8. [#9 Zahlungen und Rechnungsstatus](https://github.com/AndiT2W/t2w-base/issues/9) — blocked by #8
9. [#10 Gutschrift aus Rechnung](https://github.com/AndiT2W/t2w-base/issues/10) — blocked by #9
10. [#11 OneDrive-Ablage](https://github.com/AndiT2W/t2w-base/issues/11) — blocked by #8
11. [#12 Listen, Suche und CSV-Export](https://github.com/AndiT2W/t2w-base/issues/12) — blocked by #5, #6 und #10
12. [#13 Event-Abschluss und Abrechnungshinweis](https://github.com/AndiT2W/t2w-base/issues/13) — blocked by #3 und #6

The first implementation target is #2. It is the only ticket currently startable without completing another ticket.

## First Acceptance Test

1. Select a customer and event.
2. Create an offer from a template.
3. Adjust participant quantity and issue/send the offer.
4. Convert it to an invoice and change the amount if needed.
5. Generate the ZUGFeRD PDF with payment reference and QR code.
6. Store it manually in the configured OneDrive folder.
7. Record a partial payment, then mark the invoice paid.
8. Verify audit timeline, immutable sent document, and OneDrive link.
