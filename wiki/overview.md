# Project Overview

## Summary

This project is now defined as GCW Base, an integrated CRM, project management, invoicing, and operations platform for Temptwin and Time2Win, with an initial specification, delivery phases, and an AI-oriented roadmap.

## Current State

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

## Next Best Actions

- Decide whether MVP treats `Event` and `Project` as separate domain objects or one combined operational record.
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
