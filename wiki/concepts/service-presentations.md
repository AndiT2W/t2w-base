# Service Presentations

Services besitzen neben Name und Aktiv-Status optionale Darstellungsattribute `icon` und `color`. Die Einstellungen zeigen eine sofort sichtbare Badge-Vorschau sowie auswählbare Symbol- und Farbpresets. Dieselbe zentrale Zuordnung wird im Service-Multiselect eines Events gerendert.

Die vorgegebenen Services erhalten per Migration ihre bisherigen Präsentationen. Für neue oder unbekannte Services ist die Darstellung neutral, bis sie angepasst wird.

## Evidence

- [../../services/event-service/prisma/schema.prisma](../../services/event-service/prisma/schema.prisma)
- [../../services/event-service/prisma/migrations/0018_service_option_presentation/migration.sql](../../services/event-service/prisma/migrations/0018_service_option_presentation/migration.sql)
- [../sources/2026-09-09-user-service-presentations.md](../sources/2026-09-09-user-service-presentations.md)
