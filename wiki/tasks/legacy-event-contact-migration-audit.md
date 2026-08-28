---
title: Legacy Event Contact Migration Audit
type: task
status: complete
updated: 2026-08-28
sources:
  - ../../services/event-service/prisma/migrations/0001_initial/migration.sql
  - ../../services/event-service/prisma/migrations/0006_customer_contact_roles/migration.sql
---

# Legacy Event Contact Migration Audit

## Finding

The supported Event-Service persistence history has no separate legacy event-contact entity to migrate. From the initial schema, `EventContact.contactId` already references the canonical `Contact` table. Migration `0006_customer_contact_roles` enriches that same table with person and synchronization fields; it neither introduces nor leaves behind a parallel contact table.

Consequently, existing event-contact rows preserve their person identity through every supported migration. No name-based merge is necessary or safe in this path. The duplicate-detection requirement is therefore not applicable to the current persisted schema.

## Guard

The foreign key and the composite EventContact key in `0001_initial` ensure that an event role only references a persisted canonical contact. Existing browser workflows cover role persistence and reload through the Event-Service API.

## Follow-up

If an external pre-Event-Service export is introduced later, ingest it as a separate source and implement a staged importer with an explicit duplicate-review outcome. Do not add name-based automatic merging to the normal CRM write path.
