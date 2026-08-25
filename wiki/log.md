# Maintenance Log

## 2026-08-25

- Issue #20 aktualisiert: Die Eventdetailseite wird nicht mehr als Neubau beschrieben, sondern als Ausbau der bereits persistenten Event-Workspace-UI. Vorhandene Stammdaten-, Outlook-/SharePoint-, Tab- und Mehrsprachigkeitsfunktionen sind dokumentiert; offen bleiben insbesondere TIME2WIN-Reiter, Rollenverwaltung, mutierbare Aufgaben/Aktivitäten sowie Browser-E2E-Abdeckung.
- Die Billing-Tickets #2, #3 und #14 wurden bewusst zurückgestellt und mit dem GitHub-Label `deferred` aus der aktuellen Umsetzungspriorität genommen. Sie bleiben für eine spätere Billing-/Angebotsphase offen.

## 2026-08-23

- Published GitHub issue #32 specifying a central containerized Codex gateway with a stable internal task interface, a first `mail-summary` workflow, shared ChatGPT Plus authentication, strict security limits, and regression-test requirements.
- CRM-Seam mit zwei echten Adaptern vervollständigt: Event-Service/HTTP bleibt Standard, `VITE_CRM_ADAPTER=local` aktiviert explizit einen persistenten LocalStorage-Demo-Adapter. Beide implementieren dasselbe Person/Kunde-Interface und dieselben Beziehungsinvarianten.
- CRM-Modul auf ausschließliche Event-Service-Persistenz umgestellt; Demo-Daten und `localStorage` entfernt. Person–Kunde-Zuordnungen werden pessimistisch über `OrganizerContact` gespeichert.
- Event-Workspace vertieft: Speichern, Versionskonflikte, Datumsnormalisierung und Outlook-Synchronisierung liefern explizite Ergebnisse hinter einem Interface.
- Outlook-Eventordner-Modul vertieft: Jahreszuordnung, Quartalspfad, Drift-Erkennung und Synchronisierung liegen in einem Modul; Route und Controller enthalten keine eigene Ordnerpolicy mehr.
- TDD-Abdeckung ergänzt: 9 Root-Unit-Tests, 4 Event-Service-Tests und 17 serielle Browser-E2E-Tests erfolgreich; Frontend- und Backend-Build erfolgreich.

## 2026-08-22

- Issue #28 abgeschlossen: Gantt-Zoom-Test präzisiert, Kunden- und Outlook-Ansichten über stabile URL-Zustände erreichbar gemacht, Outlook-Sync mit sichtbarer Statusmeldung ergänzt und E2E-Mocks korrigiert. Verifiziert mit 13 grünen Browser-E2E-Tests und erfolgreichem Produktions-Build.

## 2026-08-20

- Veranstaltungsbereich um kompakte Reiter für Liste, Kalender und Gantt ergänzt; die Liste bleibt die tabellarische Standardansicht.

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
- Die Lovable-Referenzoberfläche wurde als UI-Basis übernommen und auf dem Hostinger-VPS unter `https://base.time2win.cloud` deployed. Traefik terminiert TLS; die Anwendung verwendet ihren eigenen Login. Deployment-Konfiguration: `Dockerfile.hostinger`, `docker-compose.yml` und `nginx/hostinger.conf`.
- Issue #17 begonnen: kanonische Eventstatuswerte, Veranstalter-/Sportart-/Teilnehmerwert-Typen sowie getrennte Teilnehmerprognose und aktuelle Quelle in der zentralen Daten-/Store-Schicht ergänzt. Ladefehler werden für Konsumenten exponiert; bestehende Legacy-Datensätze bleiben vorerst kompatibel.
- Issue #23 Event-Service auf Hostinger deployed: eigene PostgreSQL-Instanz, Prisma-Migration, NestJS-API, Session-Auth, Stammdaten-CRUD und täglicher Backup-Container. Login und geschützter Event-GET-Smoke-Test erfolgreich.
- Eventdetailseite bereinigt: Teilnehmer, Verantwortlicher und Risikoindikator entfernt. Risiko ist nun auch aus dem zentralen `T2WEvent`-Modell, Eventdialog, Filtern, Spalten und Variantenansichten entfernt.
- Breadcrumb-Navigation korrigiert: `TIME2WIN` ist der neutrale Root; `Übersicht` wird nur auf der Übersichtsseite als aktueller Bereich angezeigt.
- 2026-08-19: Stammdaten und Eventübersicht zeigen Outlook- und SharePoint-Ordner als klickbare Links mit Kopierfunktion. SharePoint-Links werden aus Jahres-Site und kodiertem Ordnerpfad gebildet; Outlook verweist derzeit auf Outlook Web, da im Modell nur der Ordnerpfad gespeichert ist.
- 2026-08-19: Fehlerbehebung deployed: Event-Stammdaten werden beim Speichern über die PATCH-API persistiert, Veranstalter werden als Organizer wiederverwendet/angelegt, und ein SVG-Favicon verhindert den bisherigen `/favicon.ico`-404.
- 2026-08-19: Lokale Demo-/Persistenzpfade entfernt: der Store startet ohne Demo-Events und lädt Eventdaten ausschließlich über den Event-Service. Outlook- und SharePoint-Ordner liegen nun als Felder in PostgreSQL; Migration `0002_event_folders` ergänzt die Spalten.
- 2026-08-20: Issue #22 teilweise umgesetzt: veraltete Statuswerte aus dem TypeScript-Eventmodell und den aktiven UI-Regeln entfernt; Anlage, Angebote, Kalender, Rechnungen und Ops-Filter verwenden die kanonischen Statuswerte.
- 2026-08-20: Issue #22 Anlageflow nachgeschärft: neue Events werden erst nach erfolgreichem POST in den Store übernommen und anschließend mit dem echten API-Datensatz geöffnet; Veranstalter werden bereits beim Anlegen persistiert. TIME2WIN-Synchronisierung bleibt abhängig von Issue #21.
- 2026-08-20: Playwright/Chromium-Browser-E2E-Testsetup für Issue #22 ergänzt. Drei Szenarien decken Übersichtsladen, Eventanlage per POST und Veranstalteränderung per PATCH ab; vollständiger Lauf: 3/3 bestanden.
- 2026-08-20: Einstellungen erweitert: Outlook kann je Jahr einen eigenen Stammordner verwenden; der globale Stammordner bleibt als Fallback. Das Zurücksetzen der Einstellungen leert den Eventbestand nicht mehr.
- 2026-08-20: Projektregel ergänzt: Jedes neue Feature benötigt einen Regressionstest; bevorzugt wird ein echter Browser-E2E-Test des vollständigen Nutzerablaufs.
- 2026-08-20: Event-Stammdaten um `outlookWebUrl` erweitert. Der direkte Outlook-Web-Link wird nun pro Event gespeichert, über die API persistiert und beim Outlook-Link verwendet; der bisherige Ordnerpfad bleibt als lesbare Zusatzinformation erhalten.
- 2026-08-20: SharePoint-Jahres-Sites werden in den Einstellungen numerisch absteigend nach Jahr sortiert; die aktuellste Site steht oben und die Sortierung wird beim Speichern dauerhaft übernommen.
- 2026-08-20: Demo-Datei und Demo-Texte aus der Anwendung entfernt; die Oberfläche verweist nun auf den zentralen Event-Service als Datenquelle.
- 2026-08-20: Hinweis zur Unveränderlichkeit des Eventcodes aus der Stammdaten-Kopfzeile entfernt und als kleine Zusatzinformation direkt an die Eventcode-Feldbeschriftung verschoben; E2E-Regressionstest ergänzt.
- 2026-08-20: Eventcode in der Eventdetail-Kopfzeile in dieselbe Metadatenzeile wie Veranstalter und Datum verschoben; E2E-Regressionstest ergänzt.
- 2026-08-20: In der Eventübersicht die Sammelüberschrift `Ordner` durch Outlook-/SharePoint-Symbole ersetzt und dieselben Symbole in den klickbaren Zeilenlinks ergänzt; E2E-Regressionstest ergänzt.
- 2026-08-20: Mehrsprachigkeit als Designgrundlage festgehalten: Deutsch (`de`) ist Default und Fallback, Englisch (`en`) wird ab Beginn parallel unterstützt; UI-Texte, Formatierungen und stabile sprachneutrale Fachcodes sind entsprechend auszulegen.
- 2026-08-20: Spezifikation für die mehrsprachige Produktgrundlage als [GitHub Issue #26](https://github.com/AndiT2W/t2w-base/issues/26) veröffentlicht und mit `enhancement` sowie `ready-for-agent` markiert.
- 2026-08-21: Sichtbarer Sprachumschalter in der gemeinsamen Sidebar ergänzt; Deutsch/Englisch kann dort gewählt werden und die Präferenz bleibt über Sitzungen erhalten. Browser-E2E-Test für den Bedienablauf ergänzt.
- 2026-08-21: TIME2WIN-CI umgesetzt: Markenfarben `#8DC63F`/`#05193A`, freigegebenes `time2win_logo_button.svg` als Sidebar-Icon und Favicon integriert. Ausgangs-Stylesheet als `src/styles_begin.css` archiviert; CI-Stand auf `https://base.time2win.cloud` deployed.

# 2026-08-20

- Implemented the first Outlook folder integration slice for issue #25: Graph adapter seam, stable event folder IDs/status fields, idempotent year/quarter/event folder provisioning, and a protected event sync endpoint.
- Verified with `npm run build` and the event-service Vitest suite.
- Dokumentation nachgezogen: Issue #24 und die Wiki-Konvention beschreiben jetzt die AppSettings-PostgreSQL-Persistenz, die Ursache des asynchronen Formular-State-Fehlers sowie die verbindliche E2E-Regel für neue persistente Features. Der Browser-Test muss den vollständigen UI-Ablauf abdecken und darf den PATCH nicht nur direkt per `fetch` auslösen.
- 2026-08-21: Issue #25 vervollständigt: Microsoft-Graph-Client-Credentials, paginierte Child-Folder-Suche, 409-Race-Recovery, Rate-Limit-/Sync-Status, Eventdetail-Sync-Aktion, Persistenzanzeige und Outlook-Adaptertests ergänzt.
- 2026-08-21: Die Listenansicht „Veranstaltungen“ verwendet nun dieselbe schlanke Eventtabelle wie die Übersicht; ein Browser-E2E-Test schützt die acht Kernspalten und Ordner-Symbole.
- 2026-08-21: Kontakte-Menü als „Kunden & Kontakte“ spezifiziert. Person und optionales Kundenprofil werden als ein Stammdatensatz modelliert; Veranstalter, Auszahlungsempfänger und ein oder mehrere Rechnungsempfänger sind getrennte Eventrollen. Outlook-/Gmail-Synchronisation wird nur vorbereitet. Siehe [Entscheidung Person, Kundenprofil und Eventrollen](decisions/2026-08-21-person-kundenprofil-und-eventrollen.md) und [Issue #27](https://github.com/AndiT2W/t2w-base/issues/27).
- 2026-08-21: Gantt-Ansicht um eine dreistufige Zeitachse mit Monaten, Kalenderwochen und Tageszahlen sowie Tagesraster ergänzt; Browser-E2E-Test erweitert.
- 2026-08-21: Gantt-Wochenenden und österreichische gesetzliche Feiertage werden in Kopfzeile und Tagesraster hervorgehoben; Feiertagsnamen sind per Tooltip sichtbar.
- 2026-08-21: Fehler bei der Eventcode-Persistenz behoben: Die automatisch erzeugte Vorschau ist beim Anlegen editierbar, wird im POST mitgesendet und bleibt nach dem Speichern unveränderlich; der Service verwendet den übergebenen Code statt `YYMMDD_event_<Zeitstempel>`.
- 2026-08-21: Issue #28 umgesetzt: Sidebar bereinigt, Sprachumschalter auf DE/EN reduziert, Eventaktion als Bearbeiten-Symbol dargestellt, Kalender um Tagesansicht sowie Wochenend-/Feiertagsmarkierung ergänzt und Gantt um horizontales Scrollen, Zoomauswahl und Eventzählung erweitert.
- 2026-08-21: Mehrsprachigkeit weiter umgesetzt: SSR-hydrationssichere Locale-Auswahl, echte Übersetzungsschlüssel für Sidebar/PageHeader/Eventdetail/Kalender/Varianten, verzögerte Übersetzung statischer UI-Texte sowie E2E-Abdeckung für Umschalter, Detailseite und alle Hauptrouten. Verifiziert mit `npm run build` und drei grünen Tests in `tests/e2e/language.spec.ts`.
- 2026-08-22: Live-Regression beim Sprachumschalter behoben: DE/EN verwendet jetzt hydration-sichere Hash-Navigation ohne Seitenreload; der aktuelle Stand wurde auf Hostinger deployed. Verifiziert mit drei lokalen Sprach-E2E-Tests und einer Live-Browserprüfung ohne Seitenfehler.
- 2026-08-22: Automatischer Hostinger-Deploy per GitHub Actions ergänzt. Pushes auf `main` bauen die App, laden ein `git archive` per SSH nach `/docker/t2w-base` und aktualisieren ausschließlich `app`/`nginx` per Docker Compose; Hostinger-Zugangsdaten bleiben GitHub-Environment-Secrets.
- 2026-08-22: Issue #28 nachbereinigt: die abgelösten Design-Varianten, ihre Routen und der Vergleichslink im Styleguide wurden entfernt; der Sprach-E2E-Test prüft nur noch die aktiven Anwendungsrouten.
- 2026-08-22: ClickUp-Import-Excel geprüft. Für den Eventimport müssen Kunde, Veranstalter, Rechnungsempfänger und Auszahlungsempfänger über stabile Stammdaten-IDs bzw. eine separate Zuordnungstabelle verknüpft werden; `Rechnungsempfänger` ist im Export leer, `Auszahlungsempfänger` Freitext. Wiederholte Kopfzeilen und Zeichencodierungsfehler wurden als zusätzliche Bereinigungen festgestellt.
- 2026-08-22: Importregel vereinbart: Ist der Rechnungsempfänger leer, wird der Auszahlungsempfänger als Rechnungsempfänger verwendet; die automatische Übernahme soll nachvollziehbar markiert werden.
- 2026-08-22: Fehlende englische Übersetzungen für Eventstatus und Schnellfilter ergänzt; die Sprach-E2E-Tests prüfen jetzt auch „Confirmed“ und „All statuses“.

## 2026-08-22

- Ticket #29 umgesetzt/weitergeführt: Dashboard zeigt Outlook-/SharePoint-Ordner in der Tabellenansicht nur noch als Symbole; Kalenderansichten erlauben horizontales Scrollen und zeigen Feiertagsnamen sichtbar an.
- Zahlungsziel aus dem CRM-Kundenmodell, Demo-Daten, Erzeugung und UI entfernt. CRM-Zuordnungen unterstützen Suche und Aufheben.
- Verifikation: `npm run build` erfolgreich. Repository-Lint bleibt wegen bestehender Prettier-/CRLF-Fehler in vielen Dateien rot.

# 2026-08-22

- Deepened the locale rendering module: removed the global DOM `MutationObserver`, added the explicit `useI18n().text` rendering seam, migrated shared page headers and overview status/filter text, and verified all language E2E tests.
- 2026-08-23: Issue #30 erstellt: Veranstalter im Event wird verbindlich über eine stabile Kunden-ID mit „Kunden & Kontakte“ verknüpft. Festgelegt wurden Migration bestehender Freitextwerte, Rückverknüpfung im Kundenprofil, manuelles Aufheben, getrennte Eventrollen und Browser-E2E-Tests.

# 2026-08-23

- Offene Ticket-29-Verbesserungen nachgezogen: Kalender- und Gantt-Ansichten erzwingen auf kleinen Viewports eine echte horizontale Scrollfläche; E2E-Regressionsabdeckung ergänzt für österreichische Feiertagsnamen, Scrollbarkeit, CRM-Zuordnungsaufhebung nach Reload und das entfernte Zahlungsziel.
- Verifikation: vollständige Playwright-Suite 17/17 grün; Produktions-Build erfolgreich.
- Locale rendering module vertieft: Katalog-Fallback, Legacy-Textübersetzung sowie Datums-/Zahlenformatierung liegen jetzt hinter `createLocaleRenderer`; der React-Kontext delegiert nur noch an dieses Interface. Unit-Regressionsabdeckung für Schlüssel, Fallback, Legacy-Text und Formatierung ergänzt.
- Vitest als Root-Testlauf eingerichtet (`npm test`) mit Node-Testumgebung und zentraler Konfiguration; der Locale-Rendering-Test läuft als erster Root-Unit-Test.
- Node.js benutzerlokal auf `v22.14.0` aktualisiert; die vorherige Vite-Engine-Warnung für `v22.11.0` tritt nicht mehr auf.
- 2026-08-23: Issue #30 erweitert: Namen-/Layoutkorrektur in „Kontakte & Kunden“, konsequente Umbenennung des Menübereichs sowie strukturiertes Adressmodell für Kontakte und Kunden mit Straße, Postleitzahl, Ort und Land inklusive Migration, Versandlisten-Tauglichkeit und E2E-Abdeckung.
- 2026-08-23: Issue #31 ergänzt: mobile Kalenderansicht muss Überschrift, Navigation, Legende und Raster innerhalb des Handy-Viewports darstellen; ungewollter horizontaler Overflow ist zu vermeiden und die mobile Darstellung per Browser-/Visual-Test abzusichern.
- 2026-08-23: Kunden-Detaildialog auf eine zugängliche Such-Combobox umgestellt. Kontaktoptionen filtern dynamisch; Pfeiltasten, Enter und Escape sowie ARIA-Combobox-/Listbox-Zustände sind abgedeckt. Vollständige Playwright-Suite 17/17 und Produktions-Build erfolgreich.
- 2026-08-23: Issue #30 ergänzt: Persistenzfehler bei der Neuanlage von Kontakten/Kunden für Funktion und Ort/Adresse sowie E2E-Abdeckung von Anlage, Detailansicht und Reload-Persistenz.
- 2026-08-23: Event-Architektur weiter vertieft: Der Event workspace besitzt nun die persistierte Event-Sammlung und alle pessimistischen Create/Save/Sync-Übergänge; React beobachtet sie über einen External-Store-Seam. Backend-Eventmutationen bündeln Veranstalterauflösung, Empfängerdefaults, Versionskonflikte und Empfängerersetzung atomar hinter einem Domain-Modul mit Prisma- und In-Memory-Adaptern.
- 2026-08-23: Vier Architektur-Deepenings umgesetzt: CRM workspace für autoritativen Zustand und kombinierte Übergänge, gemeinsame Event-Projektionen für alle Ansichten, Settings workspace mit Dirty-sicherem asynchronem Laden sowie ein einziges Locale-Rendering-Interface für Schlüssel und sichtbaren Text. Die bestehenden HTTP-/Persistenzinterfaces bleiben kompatibel.

# 2026-08-24

- CRM-Kundenzuordnung aus der Kontaktansicht repariert: Die Such-Combobox wartet den Persistenzrequest nun ab, verhindert doppelte Eingaben und zeigt Erfolg oder Fehler sichtbar an. Ein Browser-E2E-Test prüft den konkreten `PUT`, die sichtbare Verknüpfung und deren Persistenz nach Reload; beide Zuordnungsrichtungen sind grün.
# 2026-08-25

- Expanded the persistent Event workspace for ticket #20: event roles, tasks, file references, and manual activities now have Event-Service persistence models and detail-page actions. TIME2WIN link state is surfaced separately from the local participant forecast. Evidence: `services/event-service/prisma/migrations/0007_event_workspace/migration.sql`, `src/routes/events.$eventcode.tsx`.
# 2026-08-25

- Fixed ticket #30: contact function and location were collected in the UI but omitted by the HTTP CRM mapping and database model. They now persist via `Contact.function` and `Contact.location`; the customer creation form also exposes its billing address. A browser E2E test covers create, detail display, and reload persistence.
# 2026-08-25

- Implemented ticket #31 mobile time-navigation foundation: calendar and Gantt own bounded horizontal scroll regions, the Gantt axis includes a 90-day buffer before and after event data, and the mobile navigation trigger is sticky. Browser coverage verifies mobile scroll regions, trigger visibility, and no page-level horizontal overflow.
# 2026-08-25 – Produktionsmigrationen zuverlässig ausführen

- Login-Ansicht wurde durch HTTP-500-Antworten der geschützten Startabfragen ausgelöst, nicht durch ungültige Zugangsdaten.
- Ursache: Der Deployment-Workflow aktualisierte `event-service`, baute aber den profilbasierten `event-migrate`-Container nicht neu. Dadurch fehlten die Migrationen `0007_event_workspace` und `0008_contact_function_location` in PostgreSQL.
- Die beiden ausstehenden Migrationen wurden in Produktion eingespielt; der Workflow baut `event-migrate` nun vor dem Migrationslauf. Evidenz: [Deploy-Workflow](../.github/workflows/deploy-hostinger.yml), [Migration 0007](../services/event-service/prisma/migrations/0007_event_workspace/migration.sql), [Migration 0008](../services/event-service/prisma/migrations/0008_contact_function_location/migration.sql).
