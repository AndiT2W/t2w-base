# Source: User Target Model V1 2026-06-30

## Metadata

- Date: 2026-06-30
- Type: user conversation
- Location: chat
- Status: active

## Summary

- The target system should be event-centered, with the event as the main operational record.
- ClickUp should be replaced over time rather than modeled as a permanent dependency.
- Invoice creation should remain in Excel for now, while CRM, event data, offers, calculations, tasks, files, and communication should move into the new system.

## Event Model

### Core Event Principles

- The event is the central record in the system.
- All major operational context should attach to the event:
  - organizer
  - contacts
  - offers
  - calculations
  - tasks
  - files
  - communication
- The event itself should have only one business lifecycle status, not a separate work status.

### Event Identity

- Each event should have:
  - a stable internal numeric id
  - a human-readable `eventcode`
  - an optional `t2w_event_id`
- `t2w_event_id` should be visible in the MVP and treated as a reference to the TIME2WIN event backend when available.
- `eventcode` should be automatically suggested from the start date in `YYYYMMDD` format plus the first four meaningful cleaned words of the event name, but manually editable.
- Cleaning rules for the event name part:
  - umlauts become ASCII digraphs (`ä -> ae`, `ö -> oe`, `ü -> ue`, `ß -> ss`)
  - spaces and hyphens become `_`
  - punctuation and special characters are removed
  - stop words such as `der`, `die`, `das`, and `und` are skipped
- Folder paths should also be suggested automatically but remain editable.
- The internal numeric id and the `eventcode` are the primary event identifiers in the MVP.
- The UI should offer a backend link whenever a `t2w_event_id` is present or derivable.

### Event Statuses

- The current working event statuses are:
  - `Anfrage`
  - `Angebot gesendet`
  - `Zugesagt`
  - `Abgesagt`
  - `Akquise`
  - `Datum prüfen`
- `Zugesagt` remains the last active business status.
- Events should disappear from active views through manual archiving, not through additional end statuses.
- `Akquise` and `Datum prüfen` are currently part of the working set and may later be reconsidered as operational rather than business statuses if needed.

### Event Date And Time

- Events should use datetime fields:
  - `start_at`
  - `end_at`
- If only a date is entered:
  - `start_at` defaults to `00:00`
  - `end_at` defaults to `23:59`
- The system must support multi-day events.

### Event Core Fields

- Required event fields should include:
  - `eventname`
  - `eventstatus`
  - `veranstalter`
  - `start_at`
  - `end_at`
  - `sportart`
  - `eventcode`
- Other important event fields include:
  - optional `t2w_event_id`
  - optional participant forecast
  - optional technologies or event types, with multiple values allowed
  - optional main internal owner plus additional internal participants
  - standard organizer-side contacts for registration and finance
  - timing as an optional organizer-side contact
  - event-specific overrides for those contacts

### Event Address And Files

- The event should store a structured address:
  - street
  - postal code
  - city
  - country
- It should also support optional:
  - location name
  - address notes
- In the target model, each event should have:
  - `onedrive_event_folder_path`
  - `eventfinance_folder_path`
- These should be treated as explicit per-event references, not loose notes.
- The MVP does not need additional file-link fields beyond these two folder references.
- Each event should keep its own address, even if it often matches the organizer address.
- The address is primarily needed for arrival and logistics planning.
- The address should not drive automatic technical suggestions in the MVP.

### Event Communication

- The event should have a general note field.
- The first release should support only a manual activity list on the event.
- No automatic Outlook or WhatsApp aggregation is required in the MVP.
- No separate follow-up date is required in the MVP event model.
- The activity list should act as a simple event timeline in the MVP.
- Activities should include:
  - type
  - timestamp
  - author
  - optional linked contact
  - text
  - optional follow-up date
- Relevant activity types include:
  - mail
  - call
  - WhatsApp
  - meeting
  - note
- In the end state, Outlook, WhatsApp, and similar channels should be aggregated into the event communication view.

### Event Completeness

- The first release should show a rough completeness indicator for the event.
- This should stay simple at first and not yet be enforced by a hard rules engine.
- The completeness view should be broken down by subcategories such as:
  - registration
  - printing materials
  - personnel
  - timing
- The subcategories should make it visible how far each area is progressed.
- The subcategory list should stay extensible.

## Organizer Model

### Organizer Basics

- An organizer can be either:
  - an organization
  - an individual person
- No dedicated organizer type field is required in the first step.
- Organizers should not have a business status in v1.
- Organizers should be manually archivable.

### Organizer Master Data

- Organizers should have:
  - name
  - master address
  - multiple contacts
  - finance-related defaults
- Organizers should support:
  - default payout recipient
  - default invoice recipient
  - payout account information such as IBAN, BIC, and account holder

## Contact Model

### Contact Basics

- Contacts should primarily represent real people.
- Existing function-mail usage should be supported through additional mail addresses rather than by making function mailboxes the primary model.
- Contacts should be allowed to exist without an organizer.
- Contacts should be manually archivable.

### Contact Data

- A contact should support:
  - one primary mail address
  - optional additional mail addresses
  - one primary phone number
  - optional additional phone numbers
- A real person may also carry functional mail addresses such as registration or finance mailboxes.

## Role And Assignment Model

- Roles should not be stored as fixed properties on the person.
- Roles should belong to the assignment context.
- A contact can be linked:
  - to an organizer
  - directly to an event
- One contact can have multiple roles on the same event.
- Typical roles include:
  - registration
  - finance
  - timing
- A main contact is optional, not mandatory.
- Organizer-level default contacts should be overridable on the event.
- The contact role list should stay extensible beyond the initial core roles.
- Roles are handled both as organizer defaults and as event-specific overrides.
- The MVP does not need fixed standard assignments for the core roles.

## Offer And Calculation Model

### Offers

- Offers should be position-based.
- An event can have multiple offer versions.
- Exactly one offer version can be the released or valid one.
- Offer numbers should use a dedicated annual number range.
- Numbers should be assigned only on release.

### Calculations

- Calculations should also be position-based.
- Each event should have:
  - one main calculation
  - optional archived snapshots
- An offer can be created from a calculation.
- An offer can also be created directly without a prior calculation.

### Services And Pricing

- There should be a central service catalog.
- Events should still allow free extra positions.
- Prices should be calculated or suggested automatically but remain manually editable.
- Price logic may depend on event parameters such as:
  - participant count
  - payment mode
  - technology
  - app usage

### Offer Follow-Up

- Open offers should require follow-up.
- Follow-up should create a real todo rather than only a date field.
- The default owner should be the responsible event or customer owner.

## Billing Boundary For V1

- Invoice creation remains in Excel for now.
- The system should still already model the customer-side finance context around the event:
  - organizer
  - default payout recipient
  - default invoice recipient
- Multiple invoice splits should be represented later as multiple separate invoices, not one invoice with multiple payers.

### Invoice Statuses

- The current working invoice statuses are:
  - `erstellt`
  - `gesendet`
  - `bezahlt`
- `teilbezahlt` and `überfällig` are currently not part of the working set.

## Target Architecture Direction

- ClickUp should be replaced in the final system.
- ClickUp references may remain optional for migration, but they should not shape the target core data model.

## Related Pages

- [../overview.md](../overview.md)
- [../specification-v1.md](../specification-v1.md)
- [../concepts/event-registry-and-management.md](../concepts/event-registry-and-management.md)
- [../concepts/organizer-account-model.md](../concepts/organizer-account-model.md)
