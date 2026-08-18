# Decision: Minimal Billing Logic In T2W Base

## Status

- Accepted

## Context

- `t2w-base` already owns events, customers, products, product groups, quantities, and TIME2WIN pricing logic.
- Invoice Ninja was evaluated as an external application for quotes, invoices, PDFs, and document storage.
- TIME2WIN does not require email sending, a customer portal, or payment synchronization as part of the initial billing scope.
- Invoice Ninja uses the Elastic License 2.0 and also includes dependencies with separate licenses.

## Decision

- Keep the initial billing tool deliberately lean: replace the current ClickUp invoice list, improve traceability, and speed up quote/invoice creation without building a full accounting suite.
- Defer migration of historical ClickUp invoices and existing OneDrive PDFs; the initial workflow focuses on new documents, with migration treated as a later optional project.
- Support two fast quote-entry paths: copy an existing offer or start from a reusable offer template prefilled with customer and event data.
- Keep templates simple in the initial version; do not build a complex visual template editor.
- Use TIME2WIN participant statistics as a proposal source when an event is linked; store any accepted quantity in the offer snapshot and never update existing documents automatically.
- Refresh participant counts only through an explicit user action; `t2w-base` may retain a manually confirmed override.
- MVP line items use `quantity x unit price` as the core calculation. Special cases such as hours x persons may be shown transparently as descriptive text, but there is no general formula engine.
- Product defaults remain limited to description, unit, price, and tax; advanced factor configuration is deferred.
- Events use date-based visibility rather than the generic customer/product `Active/Inactive` rule: past events remain accessible but are hidden from the active default view and available through a separate past-events selection.
- `Abgeschlossen` is a manual event status set when operational todos are considered complete; the system warns about open todos but does not block closure.
- Implement the minimal quote and invoice workflow directly in `t2w-base`.
- Keep `ebInterface` out of the initial implementation; revisit it as a later Austrian-specific export if required.
- Generate ZUGFeRD/Factur-X as the default hybrid invoice file: a PDF/A-3 with embedded EN-16931-compatible CII XML.
- Keep the embedded structured XML extractable as a standalone download; defer all alternative e-invoice syntaxes, including `ebInterface` and Peppol/UBL, until a concrete recipient requirement exists.
- Store issued billing artifacts both in `t2w-base` and in a configurable OneDrive folder.
- Support configurable folder templates with at least a year placeholder so the existing annual filing structure can be preserved.
- Keep OneDrive storage minimal in the MVP: manually configured folder path per year/document type and explicit manual upload; no folder browser, automatic folder creation, or synchronization queue.
- Keep the billing logic behind a dedicated module interface so the document implementation can change without affecting event and pricing code.
- Store an immutable document snapshot when a quote or invoice is issued.
- Adopt the Invoice Ninja-inspired lifecycle status sets below as the canonical `t2w-base` document statuses.
- Use Invoice Ninja as a reference for proven billing concepts and edge cases, not as a copied subsystem or runtime dependency.
- Consider an Invoice-Ninja export adapter later only if external PDF, portal, payment, or archival features become necessary.

## Minimal Scope

- Product and product-group selection
- Calculated line items with quantity, unit price, discount, tax, and totals
- Quote and invoice lifecycle
- Numbering and external reference
- PDF generation and document storage
- E-invoice generation and validation
- Credit note and cancellation handling
- Audit trail for issued documents

Email delivery, customer portal, payment matching, and dunning are explicitly outside the initial scope.

For invoices to Austrian federal agencies, the implementation must also support the additional recipient and routing data required by `e-Rechnung.gv.at`/USP and the selected submission channel. `ebInterface` generation alone does not imply automatic submission to the public administration.

## Domain Rules

- `t2w-base` is the source of truth for products, prices, quantities, and billing calculations.
- An issued document uses the values captured in its snapshot; later product changes do not alter historical documents.
- A correction to an issued invoice is represented by a credit note or cancellation workflow, not by editing the original snapshot.
- Product groups are copied onto line items at document creation time.
- Converting an offer to an invoice is a convenience operation that copies the current offer data; it does not impose a monetary ceiling on later invoices.
- The offer/invoice link is for traceability only. Invoice amounts may differ because participant counts and delivered services often change after the offer.
- Adapting an offer creates a new offer with a new number; the predecessor remains immutable and is linked as `Replaced`.
- An `Approved` offer may be replaced until it has been converted; a `Converted` offer remains the historical source document.
- `Expired` is a calculated warning only; an expired offer may still be approved and converted.
- Issued documents are never deleted; they may only be cancelled, credited, or archived.
- `Ausgestellt` means the document has been generated but not externally delivered; it may return to `Draft` while no payment exists. The separate `Versendet` action is the final immutability boundary. Any payment also makes the financial content immutable.
- Recording any payment automatically activates an `Ausgestellt` invoice as `Versendet`, then derives `Teilbezahlt` or `Bezahlt` from the payment total.
- Payments may be edited or deleted for operational simplicity; every change remains in the audit log and invoice payment status is recalculated automatically.
- Overpayments and customer-credit balances are deferred from the MVP.
- For offers, `Ausgestellt` is still editable; the separate `Versendet` action is the final immutability boundary before `Approved`, `Rejected`, `Converted`, or `Replaced`.
- Credits use the same rule: `Ausgestellt` remains editable; `Versendet` is the final immutability boundary before `Teilweise verwendet` or `Verwendet`.
- Issued credits are never deleted; only drafts may be deleted, while issued credits may be archived or cancelled.
- Status/action codes remain stable internally while UI and document text support German and English independently.
- Version 1 uses one centrally configured active issuing company; the data model remains ready for future subsidiaries, but no company selector is shown initially.
- Company profile changes affect only new documents; issued snapshots retain the historical issuer, bank details, logo, and texts.
- Drafts may be permanently deleted after confirmation; no recycle bin is required. The audit log retains only minimal deletion metadata.
- Audit log entries are append-only, immutable, and not deletable; all users may read them in the document timeline.
- Events must be created in the event area before linking; the quote/invoice dialog may search and select an event but does not create one inline. Event linkage remains optional.
- Document numbers are never reused, including after deletion of a draft.

## Canonical Statuses

The following reduced status model supersedes the earlier Invoice-Ninja-parity detail for the initial MVP. The richer states remain future considerations only.

### Offers

`Draft` -> `Sent` -> `Approved` -> `Converted`

System/archive states: `Deleted`, `Archived`, `Restored`.

Once an offer is `Sent`, it cannot return to `Draft`.

### Invoices

`Draft` -> `Ausgestellt` -> `Versendet` -> `Teilbezahlt` -> `Bezahlt`

Correction and system state: `Storniert`, `Deleted` for drafts only, `Archived`.

`Überfällig` is a derived indicator, not a manually assigned primary lifecycle state. `Reversed`, multi-invoice payment allocation, automatic refunds, and complex customer-credit workflows are deferred.

### Credits / Credit Notes

`Draft` -> `Ausgestellt` -> `Versendet` -> `Teilweise verwendet` -> `Verwendet`

System/archive state: `Storniert` or `Archived`; `Deleted` is for drafts only.

In the user interface, credits are presented as Gutschriften. `Teilweise verwendet` means that part of the credit remains available; `Verwendet` means that the full credit has been assigned to its linked invoice.

## MVP Simplification

- Keep one simple payment flow attached to the invoice.
- Defer separate reverse workflows, multi-invoice allocation, automatic refunds, dedicated payment lists, dunning, and complex customer-credit accounting.
- Use a simple Gutschrift document for corrections.
- MVP credits are created only from an existing invoice; standalone credits, customer-credit balances, and cross-invoice allocation are deferred.
- Allow zero-value invoices; they receive `Bezahlt` without a payment record and do not receive a payment QR code. Negative invoice totals are forbidden and require a credit instead.

## Consequences

- There is no product/customer/price synchronization problem between two systems.
- PDF rendering, e-invoice generation, numbering, and legal document persistence become responsibilities of `t2w-base`.
- The canonical document snapshot must support both human-readable PDF output and machine-readable e-invoice output.
- The default PDF/A-3 and its embedded XML must be content-identical and stored as one immutable issued-document artifact.
- OneDrive is a secondary manual archival/export target; the canonical document remains available in `t2w-base`.
- The e-invoice XML must be schema-validated and checked against the applicable Austrian business rules before it is marked ready for delivery.
- The module must be tested against zero-price items, discounts, tax, grouped positions, page breaks, cancellations, credit notes, and e-invoice validation.
- Any code reused from Invoice Ninja must be reviewed for license notices and third-party license obligations before inclusion. Prefer a clean-room implementation of the required behaviour.

## Related Pages

- [Tool Consolidation And Migration](../concepts/tool-consolidation-and-migration.md)
- [GCW Base Consolidation](2026-06-15-gcw-base-consolidation.md)
