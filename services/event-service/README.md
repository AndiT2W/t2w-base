# TIME2WIN Event Service

Unabhängiger NestJS-Service für die zentrale Eventverwaltung. PostgreSQL ist
nicht öffentlich erreichbar und wird ausschließlich über das interne Compose-
Netzwerk angesprochen.

## Lokal starten

1. `.env.example` nach `.env` kopieren und ein starkes Datenbankpasswort
   setzen.
2. Den gemeinsamen Stack mit `docker compose up -d --build` starten.

Die Migrationen werden mit `docker compose --profile migrate run --rm
event-migrate` ausgeführt. Swagger ist unter `/docs`, Health unter `/health` und
Readiness unter `/ready` verfügbar.

Der erste Admin wird ausschließlich über `SEED_ADMIN_EMAIL` und
`SEED_ADMIN_PASSWORD` im geschützten Deployment-Umfeld mit `npm run seed`
angelegt. Das Passwort wird nur als Hash gespeichert.

## API

Die Event-API beginnt mit `/api/v1/events`. Listen unterstützen `q`, `limit`
(Standard 200, maximal 1000) und `offset`. Änderungen verwenden `version` für
optimistisches Locking.
