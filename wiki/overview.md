# Project Overview

## Summary

This project is now defined as GCW Base, an integrated CRM, project management, invoicing, and operations platform for Temptwin and Time2Win, with an initial specification, delivery phases, and an AI-oriented roadmap.

## Current State

- Die gemeinsamen `DataTable`-Listen bieten einen Excel-Export als `.xlsx` des aktuell sichtbaren Tabellenstands; Auswahl- und Aktionsspalten bleiben ausgenommen. Der Auditlog behält zusätzlich seinen CSV-Export. Die neuen PM-Darstellungen sind derzeit ausgenommen; siehe [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md) und [Design-Quellnachweis](sources/2026-09-18-claude-pm-design.md).

- Der Kunden-Importstand wurde am 2026-09-15 gegen 164 PDF-Rechnungen abgeglichen und anschließend produktiv nach Hostinger importiert: 123 Rechnungs-Kunden, alle Belege genau einmal zugeordnet, 18 zuvor fehlende Belege ergänzt und vier klare Dublettenzeilen zusammengeführt. Der Import aktualisierte 109 bestehende Organisationskonten und ergänzte 14 neue; 106 Primärkontakte sind gesetzt. Widersprüchliche oder abgeleitete Werte bleiben in der Arbeitsmappe markiert. Siehe [Rechnungen-Kundenstamm-Abgleich 2026](sources/2026-09-15-rechnungen-kundenstamm-abgleich.md).

- Fachliche Grundlage des PM ist [Spezifikation v4](tasks/project-management-spec-v4.md) für Issue #55: Event- oder globale Aufgaben, drei Status, Tagesplanung, Voraussetzungen und Kommentare. Die Claude-Überarbeitung vom 17.09.2026 ist seit Nutzerentscheidung vom 18.09.2026 die [verbindliche Designgrundlage](concepts/project-management-design.md): Event-Kategorien mit Fortschritt und Ablaufketten, Event-Zeitachse, gemeinsames Aufgabenpanel sowie globale Dringlichkeitsliste mit Filterchips. Das globale Gantt bleibt eine Desktopansicht. `PmTask` ist die kanonische Aufgabenhaltung; Migration `0028_canonical_task_projection` entfernt den alten `EventTask`-Speicher bewusst ohne Migration und Event-Schnappschüsse liefern nur Task-Readiness.

- Die ClickUp-Liste `TIME2WIN > Office > VERANSTALTUNGEN` wurde am 2026-09-15 mit 756 Hauptaufgaben erfasst. Events führen nun eine eindeutige technische `clickUpId`; ein separater Quellspeicher bewahrt den ClickUp-Rohstand für spätere Synchronisationen. Der sichtbare Eventcode bleibt der aus Datum und Eventname gebildete `YYMMDD_slug`. Siehe [ClickUp-Import Veranstaltungen](concepts/clickup-veranstaltungen-import.md).

- Der Aufgabenablauf wird seit 2026-09-15 kanonisch im Domain-Paket projiziert: verbundene Aufgaben bilden einen Ablauf, unabhängige Aufgaben getrennte Abläufe. Event- und Gesamtansicht verwenden ein gemeinsames Task-Detail; ein Task-Interaction-Workspace bündelt Bearbeitungsintentionen einschließlich Anhängen und schützt die sichtbare Historie vor verspäteten Antworten. Jede Intention liefert die stabile Identität der betroffenen Aufgabe mit ihrem aktuellen Planungsschnappschuss. Die globale Aufgabenprojektion entsteht im Event-Service; die Route filtert und stellt sie dar. Der kompakte DataTable-Vertrag gilt für die operativen Tabellen; PM-Kategorien und Dringlichkeitsliste besitzen eigene Darstellungen. Siehe [Aufgabenplanung und Tabellen-Vertiefung](concepts/task-planning-and-table-deepening-2026-09-15.md).

- Repository scaffold created on 2026-06-15.
- Initial product brief captured from user conversation on 2026-06-15.
- Organizer-centric CRM requirement captured from user conversation on 2026-06-15.
- Event-operations, invoicing, template, and critical-path requirements captured from user conversation on 2026-06-15.
- Current-system landscape captured: Zendooin backend, ClickUp, and `n8n` should be consolidated by GCW Base.
- Spreadsheet source inspected: current ClickUp export includes a central event registry with `Event Id` and linked `Veranstaltungsmanagement`.
- Detailed event-management spreadsheet inspected: one event plan is structured into grouped sections such as `Timing`, `Startnummern`, `Finanz`, and `Vorbereitung`.
- Live ClickUp workspace reviewed on 2026-06-29: separate `KUNDEN`, `KONTAKTE`, and `RECHNUNGEN` lists already exist beside event and event-management structures.
- Live ClickUp review shows that event records already reference customer-side entities such as `Kunde`, `Veranstalter`, `Organisator`, and `Rechnungsempfänger`.
- Live ClickUp review also shows cleanup needs such as duplicate customers and mixed contact/entity types.
- The inspected `260225_ART_tauern_circle.xlsx` workbook shows a strongly position-based offer and invoice structure with shared sheets for customer data, event data, services, price logic, and calculations.
- The target end-state now also includes an event-centered communication view that should eventually aggregate Outlook, WhatsApp, and other relevant communication into the event record.
- Event records store both the readable Outlook folder path and an optional direct Outlook Web URL for opening the exact folder.
- A first architecture concept now exists for an event communication knowledge service that ingests inbound and outbound mail, matches messages to events, and builds structured event knowledge on top of the communication history.
- A first user-defined target model for events, organizers, contacts, offers, calculations, files, and communication was consolidated on 2026-06-30.
- The first MVP task now focuses on event CRM with contacts, event communication, and external invoice references while keeping offer/invoice editing in Excel.
- A local Penpot stack is now available for UI work at `http://127.0.0.1:9001`, with Mailcatch at `http://127.0.0.1:1080` and the compose file under `local-services/penpot/docker-compose.yaml`.
- A first Penpot UI mockup for the Event CRM table view now exists in `Neue Datei 1` and is based on the imported SVG asset `local-services/penpot/event-crm-table-view.svg`.
- A second Penpot UI mockup now exists as a darker ops-console variant in `Neue Datei 1`, based on `local-services/penpot/event-crm-ops-console.svg`.
- A third Penpot UI mockup now exists as a Stripe-style backend variant in `Neue Datei 1`, based on `local-services/penpot/event-crm-stripe-backend.svg`.
- A fourth Penpot UI mockup now exists as a calmer Stripe-style admin table view in `Neue Datei 1`, based on `local-services/penpot/event-crm-stripe-admin-table.png`.
- A fifth Penpot UI mockup now exists as a slim event-detail MVP view in `Neue Datei 1`, based on `local-services/penpot/event-crm-event-detail-minimal.png`.
- A sixth Penpot UI mockup now exists as a slim event-list MVP view in `Neue Datei 1`, based on `local-services/penpot/event-crm-event-list-minimal.png`.
- A seventh Penpot page now exists as `MVP Flow`, based on `local-services/penpot/event-crm-mvp-flow.png`, to document the intended MVP navigation between list, detail, and TIME2WIN.
- An additional payroll-oriented Penpot UI variant now exists in a newly created Penpot project, based on `local-services/penpot/payroll-lohnuebersicht-soft-variant.png`.
- Backend UI inspiration references were collected from Stripe, Supabase, Retool, and Vercel.
- Product specification drafted in `wiki/specification-v1.md`.
- Delivery phases and roadmap documented for later AI-assisted implementation.
- Initial entity, concept, and decision pages now exist for project context.
- Design foundation added on 2026-08-20: the product is multilingual from the start, with German (`de`) as default and English (`en`) supported in parallel.
- Persistente Outlook-/SharePoint-Einstellungen liegen im Event-Service/PostgreSQL; UI-Features mit Persistenz werden künftig bevorzugt durch echte Browser-E2E-Tests abgesichert. Siehe [Persistente Einstellungen und Browser-Regressionstests](concepts/settings-persistence-and-browser-tests.md).
- Der erste serverseitige Mail-Klassifizierungs-Testservice liefert Ollama-gestützte Event- und Absichtsvorschläge sowie einen Outlook-Markierungs- und Weiterleitungsplan als Dry-Run. Er ist im Eventdetail unter Kommunikation → Mail analysieren testbar; synchronisierte Mails können nach Bestätigung nur bei `eventConfidence === 1` den Betreffpräfix `[Eventname]` erhalten. Unsichere Mails bleiben unverändert, Weiterleitungen brauchen weiterhin einen späteren expliziten Approval-Schritt. Siehe [Mail-Klassifizierungs-Testservice](tasks/mail-classifier-testservice.md) und [Entscheidung zur Mailkategorisierung](decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md).
- Produktionskorrektur am 2026-08-25: Der separate Migrations-Container wurde im Deployment nicht neu gebaut und ließ dadurch DB-Migrationen aus. Der Workflow baut `event-migrate` vor `prisma migrate deploy` nun explizit. Der Release wird zudem seit 2026-09-10 zunächst in ein geprüftes temporäres Verzeichnis entpackt und ersetzt anschließend den bisherigen Git-Inhalt unter Erhalt von `.env`; gelöschte Dateien gelangen damit nicht mehr in Docker-Builds.
- CRM besitzt ein gemeinsames Person/Kunde-Interface mit zwei explizit wählbaren Adaptern: Event-Service/HTTP als Standard und lokale Demo-Persistenz via `VITE_CRM_ADAPTER=local`. Event-Speicherung und Outlook-Ordnerkonventionen liegen ebenfalls hinter vertieften Modulen. Siehe [Deep CRM, Event Workspace, and Outlook Modules](concepts/deep-crm-event-outlook-modules.md).
- Architekturvertiefung am 2026-08-27: Event Editing Session, zentrale Auswahllisten, zusammenhängendes Tabellenverhalten und zentrale Ordnernavigation besitzen nun eigene tiefe Module. Siehe [Architekturvertiefung vom 2026-08-27](concepts/architecture-deepening-2026-08-27.md).
- Kunden- und Kontaktdetails bündeln mehrere Rollen desselben Events zu einem Eintrag und zeigen die Rollen als Chips direkt beim Event an. Ein Browser-Test sichert die Darstellung ab.
- Events können in der Veranstaltungsübersicht nach einer Bestätigung endgültig gelöscht werden; abhängige Event-Daten werden serverseitig mit entfernt, Veranstalter und Kontakte bleiben bestehen. Der Detail-Löschpfad ist durch einen Browser-Regressionstest abgesichert.
- Einstellungsnavigation folgt nun Variante E: Einstellungen klappt im globalen Menü auf; Allgemein, Auswahllisten und Outlook sind direkte Unterpunkte. Sportarten, Services und Eventrollen werden erst innerhalb der Auswahllisten-Seite als kompakte Segmente angezeigt. Siehe [Einstellungsseite](../../src/routes/einstellungen.tsx) und [App-Sidebar](../../src/components/t2w/AppSidebar.tsx).
- Issue #49 ist lokal umgesetzt: Das Benutzer- und Berechtigungsmodell umfasst eine interne Organisation, Einladungs-/Resetabläufe und die Rollen `Admin`, `Benutzer` sowie den externen `Veranstalter`. Admins besitzen immer Finanzzugriff; bei normalen internen Benutzern steuert das Häkchen `Finanzen sehen` Navigation, direkte Routen, Finanz-APIs und geschützte Felder. Veranstalterkonten sehen ausschließlich persönlich zugewiesene Eventaufgaben und dürfen dort kommentieren sowie Dateien hochladen, aber derzeit keine Aufgabenfelder oder Status ändern. Siehe [Systembenutzer und Berechtigungen](decisions/2026-09-09-systembenutzer-und-berechtigungen.md) und [Umsetzungsspezifikation](tasks/system-users-spec.md).
- Der unveränderliche Auditlog ist nun als eigener Unterpunkt in den Einstellungen sichtbar und kann nach Entität gefiltert werden. Siehe [Einstellungsseite](../../src/routes/einstellungen.tsx) und [Auditlog-E2E-Test](../../tests/e2e/auditlog-settings.spec.ts).
- Hardware-Lebenszyklusaufrufe laufen für zentrale und Event-Detailansichten über ein gemeinsames Intent-Modul; Hardware- und Auszahlungsmutationen schreiben ihre Audit-Einträge atomar über den gemeinsamen Audit-Seam. Siehe [Hardware-Lebenszyklus](../../src/lib/t2w/hardware-lifecycle.ts) und [AuditService](../../services/event-service/src/audit.service.ts).
- Die zentrale Hardware-Übersicht führt operative Rückgaben mit beschrifteten Filtern, Rücksetzoption, aussagekräftigen Kennzahlen und expliziter Überfälligkeitsmarkierung; die Browser-Regression sichert das Zurücksetzen der Filter. Siehe [Hardware-Verwaltung](tasks/hardware-management-spec.md).
- Der Hardware-Anlegeflow ist als durchgängiger rechter Sheet spezifiziert; das bestehende Inline-Editing bleibt der schnelle Bearbeitungsweg für Tabellenzeilen. Siehe [Hardware-Anlage im seitlichen Sheet](tasks/hardware-create-sheet-spec.md).
- Das Hardware-Anlegeformular folgt nun dem Muster der Kontakt-Details: sichtbare Feldbeschriftungen, Gruppen für Empfänger, Ausgabe und Details sowie ein responsives Zwei-Spalten-Raster. Die angepasste Browser-Regression prüft die Abschnitte und beschrifteten Felder. Siehe [Hardware-Workspace](../../src/components/t2w/HardwareWorkspace.tsx) und [Hardware-E2E-Test](../../tests/e2e/hardware.spec.ts).
- Der einheitliche Tabellenstandard folgt einer ClickUp-dichten Desktopansicht: 30-px-Kopfzeilen, 34-px-Datenzeilen, einzeilige 13-px-Zellen und kompakte Status-Tags. Sichtbarkeit, Sortierung und mögliche Spaltenreihenfolge sind als versionierte Benutzerpräferenz im Event-Service hinterlegt. Siehe [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).
- Nutzerentscheidung vom 2026-09-15: Inhaltseiten folgen Variante A – verfügbare Arbeitsbreite, kompakte Kennzahlen und Filterzeilen sowie unmittelbar sichtbare Tabellen. Die linke Navigation bleibt unverändert. Die globale Aufgabenliste, Übersicht, Veranstaltungen, Kontakte, Hardware, Auszahlungen und Einstellungen wurden entsprechend verdichtet. Siehe [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).
- Nutzerentscheidung vom 2026-09-15: Vollständige Datumswerte folgen dem Format `dd.mm.yyyy`; Zeitstempel zeigen die Uhrzeit erst danach. ISO-Daten bleiben intern und in nativen Datumseingaben erhalten. Die neue PM-Zeitachse ergänzt kurze Skalenbeschriftungen. Siehe [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## Next Best Actions

CI-Branding aktualisiert: TIME2WIN-Farben `#8DC63F` und `#05193A` sowie das freigegebene Logo-Asset sind integriert; der vorherige Style liegt seit dem 22.09.2026 nicht mehr als Datei im Arbeitsverzeichnis, sondern in der Git-Historie (`git show 52bd4fad:src/styles_begin.css`). Siehe [TIME2WIN CI und Branding](concepts/time2win-ci-branding.md).

- PM v4 gegen eine Staging-/Produktionsdatenbank migrieren und die bewusste Entfernung der bisherigen PM-Aufgaben vor dem Rollout erneut prüfen. Details: [PM v4](tasks/project-management-spec-v4.md).
- Normalize current ClickUp CRM-like data, especially customer duplicates and non-person contact records.
- Verify how `Kunde`, `Veranstalter`, `Organisator`, and `Rechnungsempfänger` differ operationally in the current process.
- Decide how much of the current Excel pricing and service logic should become native structured data versus retained document templates.
- Decide what the first release of event communication should be: notes only, manual activity log, or early mail integration.
- Decide the MVP boundary for event mail intelligence: archive only, archive plus matching, or archive plus extracted event facts.
- Translate the consolidated target model into a concrete entity and field schema for implementation.
- Decide whether task and event-management belong in the same MVP or the next step after the event CRM core.
- Inventory current ClickUp invoice flows and `n8n` automations in more detail.
- Clarify what remains in Zendooin and what GCW Base should replace.
- Validate Temptwin-specific workflows, roles, and permission needs.
- Prioritize the MVP feature set into an implementation backlog.
- Choose the initial technical stack and architecture approach.
- Add any existing process docs, spreadsheets, or notes to `raw/inbox/` for ingestion.
- Establish the translation-key, locale-formatting, and language-switching foundation before expanding feature UI.
