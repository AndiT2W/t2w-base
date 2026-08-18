# Invoice MVP Specification

## Problem Statement

TIME2WIN currently tracks invoices in ClickUp and stores invoice files in an annual OneDrive structure. Offer creation is slow because data and reusable calculations are spread across Excel, event data, and manual steps. The first `t2w-base` billing release should replace the ClickUp invoice list for new work, make invoice status and payment state understandable, and make offer creation faster without becoming a full accounting system.

## Solution

Build a lean billing module for one active TIME2WIN issuing company. It supports offers, invoices, and simple credit notes, with reusable offer/document templates, a transparent document lifecycle, ZUGFeRD 2.5 output, manual payment tracking, and manual OneDrive archival.

## User Stories

1. As a user, I want to create an offer from a reusable template so that recurring event offers are fast to prepare.
2. As a user, I want to copy an existing offer into a new offer so that similar events require minimal re-entry.
3. As a user, I want customer and event data prefilled so that I do not retype master data.
4. As a user, I want to create an offer without an event so that non-event work remains possible.
5. As a user, I want to adjust quantities, prices, tax, text, and validity while a document is editable.
6. As a user, I want a simple `quantity x unit price` calculation so that the document remains understandable.
7. As a user, I want special cases such as hours x persons described transparently without a general formula engine.
8. As a user, I want to save an existing offer, invoice, or credit layout as a reusable template.
9. As a user, I want to create a new offer number when adapting an existing offer so that historical offers stay unchanged.
10. As a user, I want to issue and manually send an offer so that its immutability boundary is clear.
11. As a user, I want to approve, reject, replace, or convert an offer through explicit actions.
12. As a user, I want to convert an offer into an invoice to reuse its data without enforcing the offer amount.
13. As a user, I want an invoice to differ from its offer because participant counts and delivered services can change.
14. As a user, I want to create an invoice from an event, offer, template, or manually.
15. As a user, I want a fixed-amount invoice line so that simple invoices are quick to create.
16. As a user, I want the invoice recipient to be separate from the event organizer.
17. As a user, I want several invoices for one event so that different legal recipients can be billed separately.
18. As a user, I want one tax rate per document so that the initial tax model stays simple.
19. As a user, I want a customer tax profile to prefill the document tax settings.
20. As a user, I want missing or unconfirmed EU UID data to produce a warning without blocking issuance.
21. As a user, I want a reason required when using 0% tax.
22. As a user, I want discounts as either a percentage or fixed amount and visible on the document.
23. As a user, I want German and English document output.
24. As a user, I want EUR-only documents in the first release.
25. As a user, I want a payment reference equal to the invoice number.
26. As a user, I want a prefilled SEPA payment QR code on positive-value invoices.
27. As a user, I want a ZUGFeRD PDF/A-3 containing the embedded structured e-invoice.
28. As a user, I want the embedded XML extractable when needed, without storing a separate XML file in OneDrive.
29. As a user, I want the final ZUGFeRD file generated and validated when the document is marked `Versendet`.
30. As a user, I want technical ZUGFeRD validation errors to block sending and explain the affected field.
31. As a user, I want a payment recorded as a full or partial payment.
32. As a user, I want `Als bezahlt markieren` to create a simple manual payment record automatically.
33. As a user, I want payment records to be editable or deletable, with audit history and automatic status recalculation.
34. As a user, I want a zero-value invoice to become `Bezahlt` without a payment record or QR code.
35. As a user, I want negative invoice totals prevented and represented by a credit instead.
36. As a user, I want to create a credit only from an existing invoice in the MVP.
37. As a user, I want a credit to be linked to at most one invoice.
38. As a user, I want the credit reason and original invoice reference stored.
39. As a user, I want an issued credit to be immutable after `Versendet`.
40. As a user, I want a compact invoice, offer, and credit list with search and filters.
41. As a user, I want a global search across document number, customer, event, status, and OneDrive path.
42. As a user, I want CSV export of the currently filtered document list.
43. As a user, I want a document timeline showing status, payments, validation, OneDrive actions, and corrections.
44. As a user, I want the active event view to hide past events while keeping them searchable.
45. As a user, I want to manually complete an event after its todos are done, with a warning if todos remain open.
46. As a user, I want a dismissible reminder to check billing when a completed event has no linked invoice.
47. As a user, I want the final ZUGFeRD PDF manually uploaded to a configured OneDrive folder per year and document type.
48. As a user, I want the OneDrive link and upload result visible on the document.

## Implementation Decisions

- Version 1 has one centrally configured active issuing company; the data model remains ready for future subsidiaries.
- Initial scope is B2B in Austria and the EU, with German and English output and EUR only.
- ZUGFeRD 2.5, profile EN 16931, is the only initial e-invoice format. `ebInterface` and Peppol/UBL are deferred.
- The standard artifact is a PDF/A-3 with embedded CII XML. The XML must be extractable but is not stored separately in OneDrive.
- Final document generation, validation, numbering, and OneDrive upload occur at `Versendet`.
- Drafts use an internal reference such as `ENTWURF-1042`. Official numbers are assigned at `Versendet` and never reused: `A260001`, `R260001`, `G260001`.
- Annual counters reset to `0001`; document type and company have separate counters.
- UI status flows are:
  - Offers: `Entwurf -> Ausgestellt -> Versendet -> Angenommen -> Umgewandelt`, with `Abgelehnt`, `Ersetzt`, and `Archiviert` as additional states/actions.
  - Invoices: `Entwurf -> Ausgestellt -> Versendet -> Teilbezahlt -> Bezahlt`, with `Storniert` and `Archiviert` as additional states/actions; `Überfällig` is derived.
  - Credits: `Entwurf -> Ausgestellt -> Versendet -> Teilweise verwendet -> Verwendet`, with `Storniert` and `Archiviert` as additional states/actions.
- `Ausgestellt` can return to `Entwurf` while the document has not been externally sent and has no payment. `Versendet` is the final immutability boundary.
- Status changes use explicit actions, not a free status dropdown. Invalid transitions are prevented.
- One active company, no role model, and all users may perform the available actions initially. The append-only audit timeline records who did what and when.
- Customer and event are fast-search fields. Customers can be created inline; events must exist before linking.
- Event linkage is optional. Event participant counts may be refreshed manually from TIME2WIN when linked; accepted quantities are copied into the document and never auto-update.
- Products remain simple: code, name, description, unit, standard price, standard tax, optional group, active/inactive. No customer price lists, stock, or formula engine.
- Core line calculation is `quantity x unit price`. Special calculations are represented by clear description text, not structured formula logic.
- One tax rate applies to all positions in a document. Customer tax profiles prefill the rate and tax reason; document values remain editable while drafting.
- Discounts are one document-level percentage or fixed amount. Quantities allow up to four decimal places; monetary values use two decimals and transparent rounding.
- Templates are shared per company and language/document type. Templates can be created from existing documents; later template edits do not alter existing drafts.
- Invoices use payment by bank transfer only. The invoice number is the payment reference. A SEPA QR code is generated only for positive open amounts.
- Payments are simple records attached to an invoice. Full/partial payment actions recalculate status. Payment records may be changed or deleted, with immutable audit entries.
- MVP credits are created from an invoice only, with a mandatory reason and optional original-invoice reference. One credit can be applied to one invoice; no multi-invoice credit balance system.
- OneDrive uses a manually entered/configured folder path per year and document type. The user explicitly uploads the final ZUGFeRD PDF; no folder browser, automatic folder creation, sync queue, or historical migration is required.
- Offers, invoices, and credits have separate lists, a shared search, standard filters, and filtered CSV export. No separate billing dashboard, payment list, customer portal, recurring invoices, bank import, or dunning.

## Testing Decisions

- Test observable user workflows rather than implementation details.
- The primary end-to-end seam is the document lifecycle: template/event/customer selection -> draft -> issue -> send -> payment -> final document/archive.
- Test offer copy and template creation, customer/event prefill, offer conversion with changed amount, and new numbering.
- Test status transition rules, return to draft before send, immutability after send, and audit timeline contents.
- Test one-rate tax calculation, 0% reason, discount modes, quantity precision, rounding, zero totals, and negative-total rejection.
- Test ZUGFeRD PDF/A-3 creation, embedded XML extraction, XML/PDF consistency, schema/business validation, QR content, and validation error display.
- Test full payment, partial payment, payment edit/delete, automatic status recalculation, and credit application to one invoice.
- Test manual OneDrive upload, configured year/document path, overwrite behavior, stored link, and failed upload reporting.
- Test German and English output, invoice/offer/credit lists, filters, global search, CSV export, and past-event visibility.

## Out of Scope

- Historical ClickUp/OneDrive invoice migration
- Multiple active companies in the UI
- Roles and permissions
- `ebInterface`, Peppol/UBL, and alternative e-invoice syntaxes
- Full accounting, ledger, bank import, payment matching, customer portal, online payments, email sending, reminders, dunning, and recurring invoices
- Standalone credits, multi-invoice credit allocation, customer-credit balances, automatic refunds, and reverse workflows
- Customer price lists, stock, general formula engines, complex factor modeling, and a visual template builder
- Separate payment list, billing dashboard, and advanced reporting

## Further Notes

The first acceptance flow is: select customer/event -> create offer from template -> adjust quantity/price -> send offer -> convert to invoice -> adjust invoice if needed -> generate/validate ZUGFeRD PDF with QR -> manually upload to OneDrive -> record partial/full payment -> verify audit timeline and final document immutability.
