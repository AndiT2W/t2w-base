# MVP: Event CRM With Invoices And Contacts

## Status

- draft

## Goal

Define the first usable version of `t2w-base` for event data, organizer/contact handling, and external invoice references while keeping offer and invoice document creation in Excel for now.

## MVP Scope

- Event as the central record
- Organizer master data
- Contact master data
- Event-to-contact role assignments
- Manual event communication log with a quick phone-call entry
- Optional event todo created directly from a phone note or email
- Unified event timeline for manual activities and email messages
- Cross-channel search across event notes and ingested email
- Event file and folder references
- External offer references as links
- External invoice references as links plus metadata

## Event Fields

- internal numeric `id`
- `eventcode`
- optional `t2w_event_id`
- `eventname`
- `ort` als Freitext
- `eventstatus`
- `veranstalter`
- `start_at`
- `end_at`
- `sportart`
- optional technologies
- optional participant forecast
- optional main internal owner
- optional additional internal participants
- optional standard contacts for registration, finance, and timing
- optional event-specific contact overrides
- optional default invoice recipient
- optional default payout recipient
- keine strukturierte Adresse im aktuellen MVP; `ort` bleibt Freitext
- OneDrive event folder path
- Eventfinance folder path
- notes

## Organizer Fields

- name
- optional legal name
- address
- financial defaults
- default invoice recipient
- default payout recipient
- archive flag

## Contact Fields

- real person as primary model
- display name
- primary email
- additional emails
- primary phone
- additional phones
- archive flag

## Roles

- roles are assigned in context, not stored as permanent person properties
- organizer-level defaults can be overridden at event level
- event-level roles can be duplicated for the same contact if needed
- relevant roles: `anmeldung`, `finanzen`, `timing`

## Communication

- manual activity log on the event
- activity type
- author
- optional linked contact
- text
- optional follow-up date

## External Documents

- offer stays in Excel/PDF
- invoice stays in Excel/PDF
- the system stores links and lightweight metadata
- offer is a reference only, no offer editor in MVP
- invoice is a reference only, no invoice editor in MVP

## Invoice Reference

- linked to one event
- invoice number
- invoice date
- due date
- recipient reference or free-text override
- net amount
- gross amount
- currency, default `EUR`
- paid date
- status: `Erstellt`, `Gesendet`, `Bezahlt`, `Storniert`
- Excel link
- PDF link
- notes

## Exclusions

- no native offer editor
- no native invoice editor
- no billing engine
- no automatic WhatsApp integration in the first MVP slice
- no ClickUp dependency in the target model
- no complex role taxonomy
- no automatic overdue status as a stored state

## Open Questions

- Do we need task/event-management in MVP or in the next step?
- Should there be a first import path from ClickUp and Excel, or only manual entry?
- Which communication types should appear in the MVP activity log first?
