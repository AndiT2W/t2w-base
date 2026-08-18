# MVP Backlog: Event CRM With Invoices And Contacts

## Status

- draft

## Objective

Break the MVP into a small set of implementation-ready chunks for event CRM, contacts, event communication, and external invoice references.

## Priority 1: Data Model

- Define the database schema for `events`, `organizers`, `contacts`, `event_contact_roles`, `organizer_contact_roles`, `activities`, `offer_references`, and `invoice_references`.
- Add enums for `eventstatus`, invoice status, activity type, and role names.
- Keep foreign keys and archive fields consistent.

## Priority 2: Event CRUD

- Create event records with the required core fields.
- Edit and archive event records.
- Show event completeness at a basic level.
- Support the event date/time defaults when only a date is entered.

## Priority 3: Organizer And Contact CRUD

- Create and edit organizers.
- Create and edit contacts as real people.
- Allow contacts to exist without an organizer.
- Archive organizers and contacts without deleting data.

## Priority 4: Role Assignment

- Store default contact roles on the organizer.
- Store event-specific contact roles on the event.
- Allow one contact to have multiple roles at one event.
- Allow event-level overrides of organizer defaults.

## Priority 5: Event Communication

- Add manual activities to an event.
- Support activity type, author, timestamp, optional contact, text, and follow-up date.
- Make event communication visible in one shared timeline.

## Priority 6: External Document References

- Store one or more offer references per event.
- Store one or more invoice references per event.
- Persist Excel and PDF links or folder paths.
- Persist invoice number, dates, recipient, amounts, currency, and status.

## Priority 7: Search And Overview

- Show a list of events with status, date, organizer, and key finance indicators.
- Support quick filtering by status and archive state.
- Surface overdue invoice hints as derived information.

## Later Steps

- Import existing ClickUp CRM data.
- Import or link Excel source data for events, offers, and invoices.
- Add event task management.
- Add Outlook and WhatsApp aggregation.
- Add richer automation around reminders and completeness checks.

