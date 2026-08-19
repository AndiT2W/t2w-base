# TIME2WIN Event Service

Unabhängiger NestJS-Service für die zentrale Eventverwaltung. PostgreSQL ist
nicht öffentlich erreichbar und wird ausschließlich über das interne Compose-
Netzwerk angesprochen.

## Lokal starten

1. `.env.events.example` nach `.env.events` kopieren und ein starkes
   Datenbankpasswort setzen.
2. `services/event-service/.env.example` nach
   `services/event-service/.env` kopieren und `DATABASE_URL` anpassen.
3. `docker compose --env-file .env.events -f docker-compose.events.yml up -d --build`.

Die Migrationen werden mit `npm run prisma:migrate` innerhalb des Service-
Containers ausgeführt. Swagger ist unter `/docs`, Health unter `/health` und
Readiness unter `/ready` verfügbar.

Der erste Admin wird ausschließlich über `SEED_ADMIN_EMAIL` und
`SEED_ADMIN_PASSWORD` im geschützten Deployment-Umfeld mit `npm run seed`
angelegt. Das Passwort wird nur als Hash gespeichert.

## API

Die Event-API beginnt mit `/api/v1/events`. Listen unterstützen `q`, `limit`
(Standard 200, maximal 1000) und `offset`. Änderungen verwenden `version` für
optimistisches Locking.
