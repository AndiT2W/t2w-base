# Maintenance Log

## 2026-08-17

- Adopted Invoice Ninja-inspired canonical statuses for offers, invoices, and credits/gutschriften in `t2w-base`; `Overdue` and `Unpaid` remain derived indicators.
- Chose stricter audit-safe behavior than Invoice Ninja for issued-document deletion and permanent non-reuse of document numbers.
- Chose ZUGFeRD/Factur-X as the standard hybrid invoice artifact, with extractable XML and additional `ebInterface`/Peppol exports only when needed.
- Added configurable OneDrive archival as a second storage target, preserving the current year-based `EVENTFINANCE`/`03_rechnungen` filing pattern.
- Deferred `ebInterface` from the initial implementation; ZUGFeRD/Factur-X remains the initial standard invoice artifact.
- Deferred Peppol/UBL as well; version 1 produces only ZUGFeRD/Factur-X.
- Clarified that offer-to-invoice conversion only copies data for convenience; invoice values may exceed or differ from the offer because participant counts are often unknown when quoting.
- Chose new offer numbers instead of separate version numbers; predecessor offers remain linked and can be marked `Replaced`.
- Clarified that expired offers may still be approved and converted; `Expired` is only a warning indicator.
- Set the primary scope constraint: keep the invoice tool lean, replace the ClickUp invoice list, improve traceability, and accelerate quote creation rather than building a complex accounting suite.
- Confirmed two fast quote-entry paths: copy an existing offer or use a reusable customer/event-prefilled offer template.
- Deferred importing existing ClickUp invoices and OneDrive PDFs; migration will not block the initial billing workflow.
- Decided that TIME2WIN participant counts are manual-refresh proposal values; accepted quantities are copied into offers and never auto-overwrite existing documents.
- Added transparent multi-factor line-item calculations for cases such as hourly rate per person; initial scope allows up to two factors.
- Added simple product-level calculation defaults for price basis and factor units, without introducing a general formula engine.
- Clarified that events use date-based active/past visibility; past events remain accessible through a separate selection instead of being deactivated like master data.
- Decided that event completion is manual with an open-todo warning, not automatic from the event date.
- Allowed a limited return from `Sent`/`Ausgestellt` to `Draft` before external delivery or payment, as a deliberate simpler-than-Invoice-Ninja workflow.
- Clarified that `Ausgestellt` is reversible before delivery, while the separate `Versendet` action is the final immutability boundary.
- Decided that recording a payment automatically activates an `Ausgestellt` invoice and derives its payment status.
- Chose to allow payment edits and deletion with audit logging and automatic invoice-status recalculation.
- Confirmed that overpayments remain allocatable customer credit and can be manually refunded.
- Applied the no-delete-after-issue rule to credits/gutschriften as well.
- Confirmed independent German/English localization for UI and billing documents with stable internal status codes.
- Confirmed one centrally configured issuing company for version 1; historical documents retain their original company profile snapshot.
- Chose permanent confirmed deletion for drafts without a recycle bin; retain minimal deletion metadata in the audit log.
- Confirmed append-only, immutable audit logs readable by all users without role restrictions.
- Simplified the billing MVP to six invoice states (`Entwurf`, `Ausgestellt`, `Versendet`, `Teilbezahlt`, `Bezahlt`, `Storniert`) and deferred Invoice-Ninja-style reverse/guthaben complexity.
- Kept both invoice-based and standalone credits, but limited MVP application to a simple one-credit-to-one-invoice relationship.
- Confirmed zero-value invoices are allowed and immediately `Bezahlt` without payment QR; negative invoices are not allowed.
- Further simplified the MVP: invoice-based credits only, core `quantity x unit price` calculations, and manual OneDrive upload to configured year/document folders without sync automation.
- Kept event creation out of the billing dialog; events are pre-existing optional links for offers and invoices.
- Applied the same reversible-before-delivery and immutable-after-delivery rule to offers.
- Applied the same delivery boundary to credits/gutschriften.

## 2026-06-15

- Initialized Karpathy-style LLM wiki scaffold.
- Added `AGENTS.md` schema, raw source intake area, and wiki section indices.
- Captured initial Temptwin product brief from user conversation.
- Added specification v1, delivery phases, and AI-oriented roadmap.
- Added initial entity, concept, and decision pages for the product direction.
- Refined the CRM scope so customers are modeled as organizers with multiple contacts and roles.
- Refined project operations around event templates, critical path visibility, mixed assignment targets, and invoicing scope.
- Documented the current tool landscape and defined GCW Base as the consolidation target for Zendooin, ClickUp, and `n8n` workflows.
- Inspected the current `VERANSTALTUNGEN.xlsx` export and modeled `Event` plus linked `Veranstaltungsmanagement` as core domain concepts.
- Inspected one event-management export and refined the grouped task-section model for concrete event execution.

## 2026-06-29

- Inspected the live ClickUp workspace structure and confirmed separate `KUNDEN`, `KONTAKTE`, and `RECHNUNGEN` lists in addition to `VERANSTALTUNGEN` and event-specific management lists.
- Recorded live data volumes for the CRM-like and invoice lists and documented their current statuses and modeling implications.
- Captured data-quality issues in ClickUp, including duplicate customer records and mixed contact/entity types that will affect CRM migration.
- Captured a more precise event-finance role model from user conversation, including independent invoice recipients, sponsor billing, mixed legal entities per event, and `Nenngeld` payouts to organizer-side entities.
- Inspected the Tauern Circle ART workbook and documented that the current offer and invoice process is based on shared line items, customer/event master data, and embedded price calculations.
- Captured the end-state vision that event records should aggregate communication across channels such as Outlook and WhatsApp into a shared event timeline.

## 2026-06-30

- Consolidated a first target model for GCW Base covering the event record, organizer and contact handling, offer and calculation behavior, file links, and event-centered communication.
- Clarified that ClickUp is a migration source rather than a target dependency, while invoice creation remains in Excel for the first stage.
- Created an MVP task note for event CRM with contacts, manual event communication, and external invoice references.
- Added an implementation-oriented backlog for the MVP, prioritizing schema, CRUD, roles, communication, document references, and event lists.
- Set up a local Penpot Docker stack for UI design work at `http://127.0.0.1:9001`, using the official Penpot compose template with local mailcatch on `http://127.0.0.1:1080`.
- Created the first Penpot UI mockup for the event CRM as a table-view SVG import in `Neue Datei 1`, using the asset `local-services/penpot/event-crm-table-view.svg`.
- Added a second Penpot ops-console variant in `Neue Datei 1` using `local-services/penpot/event-crm-ops-console.svg`.
- Added a third Penpot Stripe-style backend variant in `Neue Datei 1` using `local-services/penpot/event-crm-stripe-backend.svg`.
- Added a fourth Penpot admin-table variant in `Neue Datei 1` using `local-services/penpot/event-crm-stripe-admin-table.png`, with a Stripe-like left nav, KPI cards, event/invoice table, and right detail panel.
- Added a fifth Penpot slim event-detail variant in `Neue Datei 1` using `local-services/penpot/event-crm-event-detail-minimal.png`, focused on the MVP fields only.
- Added a separate `Page 2` in the Penpot file so the slim event-detail MVP view can be surfaced independently in the sidebar.
- Added a sixth Penpot slim event-list variant in `Neue Datei 1` using `local-services/penpot/event-crm-event-list-minimal.png` and surfaced it as a separate `Event List MVP` page.
- Added a seventh Penpot `MVP Flow` page in `Neue Datei 1` using `local-services/penpot/event-crm-mvp-flow.png` to show the intended navigation from list to detail to TIME2WIN.
- Captured the working event-status set from user conversation: `Anfrage`, `Angebot gesendet`, `Zugesagt`, `Abgesagt`, `Akquise`, and `Datum prüfen`.
- Captured the working invoice-status set from user conversation: `erstellt`, `gesendet`, and `bezahlt`.
- Captured that event addresses are optional in v1 but recommended for arrival and logistics planning.
- Captured that event addresses should not trigger automatic technical suggestions in the MVP.
- Captured that the event owner field is optional in the MVP.
- Captured that an event may have multiple internal team members even without fixed roles.
- Captured that organizer-side contacts are `Anmeldung` and `Finanzen` by default, with `Timing` optional.
- Captured that each event should carry explicit `OneDrive` and `Eventfinance` folder references.
- Captured that the MVP does not need additional file-link fields beyond the two folder references.
- Captured that event communication in the MVP is manual only, without Outlook or WhatsApp aggregation yet.
- Captured that the MVP event model does not need a separate follow-up date.
- Captured that the manual activity list should act as a simple event timeline in the MVP.
- Captured that event completeness should be shown with subcategories such as registration, printing materials, personnel, and timing.
- Captured that the event completeness subcategory list should stay extensible.
- Captured that each event should keep its own structured address, even if it matches the organizer address.
- Captured that contact roles stay extensible beyond the initial core roles.
- Captured that roles are handled on both organizer and event level, with organizer defaults and event overrides.
- Captured that the MVP does not need fixed standard assignments for the core contact roles.
- Captured that events use an internal numeric id plus a human-readable `eventcode` as primary identifiers in the MVP.
- Captured that `eventcode` is suggested from `YYYYMMDD` plus the first four meaningful cleaned words of the event name, but remains manually editable.
- Captured the `eventcode` cleaning rules: umlauts to ASCII digraphs, underscores for spaces and hyphens, special characters removed, and stop words skipped.
- Captured that `t2w_event_id` should be visible in the MVP and link to the TIME2WIN backend when available.
- Collected backend UI inspiration references from Stripe, Supabase, Retool, and Vercel for future dashboard styling.
- Created a new local Penpot project for an additional TIME2WIN payroll UI variant and imported `local-services/penpot/payroll-lohnuebersicht-soft-variant.png`.
- Added the source page `wiki/sources/2026-07-01-penpot-payroll-lohnuebersicht-soft-variant.md` plus the new SVG/PNG assets for the payroll overview variant.
# 2026-07-07

- Added a source page for the user request about an event-centered mail analysis and knowledge service.
- Added the concept page [concepts/event-communication-knowledge-service.md](concepts/event-communication-knowledge-service.md) to capture a proposed pipeline, data model, matching strategy, MVP slice, and risks.
## 2026-08-17

- Explored an Invoice Ninja-inspired T2W Base shell with left-side navigation, top global search, and an operations-focused overview for events, tasks, invoices, and communication. Inline mockup: `t2w-invoice-ninja-layout.html` in the thread visualization workspace.
- Discussed additional event-planning views: calendar, week, event-weekend, and Gantt/timeline. Proposed using them as synchronized projections of the same event/task data, with Gantt inside event detail and the weekend view focused on live operations.
- Refined the planning requirement: the weekly overview must show event counts per day together with resource capacity rows, especially vehicles. A resource-calendar mockup was created with day totals, vehicle/team rows, and visible conflicts.
# 2026-08-17

- Concrete communication-hub UX and implementation shape added to [Event Communication Knowledge Service](concepts/event-communication-knowledge-service.md): unified event timeline, latest-facts/open-loops side rail, channel adapters, review queue, and phased delivery.
- MVP priority clarified: fast manual phone-call notes per event plus a unified searchable view of notes and email messages; automated intelligence and WhatsApp integration follow later.
- Outlook folder convention confirmed as a practical integration path: synchronize each event folder automatically; handle Sent Items by folder membership first and message matching as fallback.
- Follow-ups clarified as ordinary event todos linked to their source communication, rather than a separate "Wiedervorlage" concept.

# 2026-08-18

- Split the lean Invoice MVP parent issue [#1](https://github.com/AndiT2W/t2w-base/issues/1) into twelve dependency-ordered tracer-bullet tickets #2–#13, all marked `ready-for-agent`.
- The first implementation target is [#2 Billing-Grundgerüst und erster Angebotsentwurf](https://github.com/AndiT2W/t2w-base/issues/2).
# 2026-08-19

- Verbindliche Eventstatuswerte aus dem Wiki bestätigt: Anfrage, Angebot gesendet, Zugesagt, Abgesagt, Akquise und Datum prüfen. Die bisherige UI-Statusliste ist fachlich überholt.
- Neue Events starten standardmäßig mit dem Status `Anfrage`.
- Eventfeldentscheidung: Risiko wird nicht als Eventfeld geführt.
- Eventort bleibt im aktuellen MVP ein Freitextfeld; strukturierte Adressdaten sind nicht erforderlich.
- Sportart wird als erweiterbares Dropdown mit direkter Option zum Hinzufügen einer neuen Sportart geführt.
- Veranstalter wird über ein Such-Dropdown gewählt; neue Veranstalter können direkt aus dem Modal angelegt werden.
- Ort bleibt ein optionales Freitextfeld.
- Hauptverantwortlicher ist im Anlageformular optional. Teilnehmerzahlen werden nicht manuell im Modal erfasst, sondern bei gesetzter `t2w_event_id` einmal täglich aus TIME2WIN synchronisiert. Technologien/technische Leistungen werden optional auf der Detailseite gepflegt.
- Teilnehmerprognose und aktueller, aus TIME2WIN synchronisierter Teilnehmerstand werden getrennt gespeichert.
- `t2w_event_id` erhält auf der Eventdetailseite einen eigenen Reiter `TIME2WIN-Verknüpfung` neben `Stammdaten`.
- Die TIME2WIN-Verknüpfung zeigt Bewerbe und Teilnehmerstatistiken je Bewerb sowie Synchronisierungsstatus und manuelle Aktualisierung.
- Pro Bewerb wird im MVP ausschließlich die Zahl der gemeldeten Teilnehmer angezeigt.
- Einzelteilnehmer und Teams werden dabei nicht getrennt ausgewiesen.
- Sportart kann bei verknüpfter `t2w_event_id` aus der TIME2WIN-API stammen. Ohne ID wird sie manuell gepflegt; eine spätere API-Abweichung überschreibt den manuellen Wert nicht ungefragt.
- Die Lovable-Referenzoberfläche wurde als UI-Basis übernommen und auf dem Hostinger-VPS unter `https://base.time2win.cloud` deployed. Traefik terminiert TLS; die Anwendung verwendet ihren eigenen Login. Deployment-Konfiguration: `Dockerfile.hostinger`, `docker-compose.hostinger.yml` und `nginx/hostinger.conf`.
- Issue #17 begonnen: kanonische Eventstatuswerte, Veranstalter-/Sportart-/Teilnehmerwert-Typen sowie getrennte Teilnehmerprognose und aktuelle Quelle in der zentralen Daten-/Store-Schicht ergänzt. Ladefehler werden für Konsumenten exponiert; bestehende Legacy-Datensätze bleiben vorerst kompatibel.
- Issue #23 Event-Service auf Hostinger deployed: eigene PostgreSQL-Instanz, Prisma-Migration, NestJS-API, Session-Auth, Stammdaten-CRUD und täglicher Backup-Container. Login und geschützter Event-GET-Smoke-Test erfolgreich.
- Eventdetailseite bereinigt: Teilnehmer, Verantwortlicher und Risikoindikator entfernt. Risiko ist nun auch aus dem zentralen `T2WEvent`-Modell, Eventdialog, Filtern, Spalten und Variantenansichten entfernt.
- 2026-08-19: Stammdaten und Eventübersicht zeigen Outlook- und SharePoint-Ordner als klickbare Links mit Kopierfunktion. SharePoint-Links werden aus Jahres-Site und kodiertem Ordnerpfad gebildet; Outlook verweist derzeit auf Outlook Web, da im Modell nur der Ordnerpfad gespeichert ist.
- 2026-08-19: Fehlerbehebung deployed: Event-Stammdaten werden beim Speichern über die PATCH-API persistiert, Veranstalter werden als Organizer wiederverwendet/angelegt, und ein SVG-Favicon verhindert den bisherigen `/favicon.ico`-404.
- 2026-08-19: Lokale Demo-/Persistenzpfade entfernt: der Store startet ohne Demo-Events und lädt Eventdaten ausschließlich über den Event-Service. Outlook- und SharePoint-Ordner liegen nun als Felder in PostgreSQL; Migration `0002_event_folders` ergänzt die Spalten.
- 2026-08-20: Issue #22 teilweise umgesetzt: veraltete Statuswerte aus dem TypeScript-Eventmodell und den aktiven UI-Regeln entfernt; Anlage, Angebote, Kalender, Rechnungen und Ops-Filter verwenden die kanonischen Statuswerte.
- 2026-08-20: Issue #22 Anlageflow nachgeschärft: neue Events werden erst nach erfolgreichem POST in den Store übernommen und anschließend mit dem echten API-Datensatz geöffnet; Veranstalter werden bereits beim Anlegen persistiert. TIME2WIN-Synchronisierung bleibt abhängig von Issue #21.
- 2026-08-20: Playwright/Chromium-Browser-E2E-Testsetup für Issue #22 ergänzt. Drei Szenarien decken Übersichtsladen, Eventanlage per POST und Veranstalteränderung per PATCH ab; vollständiger Lauf: 3/3 bestanden.
- 2026-08-20: Einstellungen erweitert: Outlook kann je Jahr einen eigenen Stammordner verwenden; der globale Stammordner bleibt als Fallback. Das Zurücksetzen der Einstellungen leert den Eventbestand nicht mehr.
- 2026-08-20: Demo-Datei und Demo-Texte aus der Anwendung entfernt; die Oberfläche verweist nun auf den zentralen Event-Service als Datenquelle.
