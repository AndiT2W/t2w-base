# Project management persistence tests

These tests drive Chromium through the real Vite UI, NestJS API and PostgreSQL. No PM requests are mocked. Use a dedicated local database whose name starts with `pm_`; the tests create durable fixtures, exercise immutable history and temporarily inject an audit failure.

PowerShell setup (choose an unused local port/container name):

```powershell
docker run -d --name t2w-pm-tests -e POSTGRES_USER=pm_test -e POSTGRES_PASSWORD=pm-test-only -e POSTGRES_DB=pm_test -p 127.0.0.1:15455:5432 postgres:16-alpine
$env:PM_TEST_DATABASE_URL='postgresql://pm_test:pm-test-only@127.0.0.1:15455/pm_test'
$env:DATABASE_URL=$env:PM_TEST_DATABASE_URL
npm run build:domain
npm run prisma:generate --workspace t2w-event-service
npx prisma migrate deploy --schema services/event-service/prisma/schema.prisma
npm run build --workspace t2w-event-service
npx playwright test --config playwright.pm.config.ts
npm run test --workspace t2w-event-service
npx vitest run packages/domain/src --config services/event-service/vitest.config.ts
```

The Playwright configuration starts API port 3015 and frontend port 4175; `PM_API_PROXY` enables the local proxy only for this run. Do not rebuild or edit application files during browser execution because a Vite restart can interrupt requests. The ordinary mocked regression suite remains `npm run test:e2e` on port 4173.

Coverage includes assignment, deadlines, references, dependency gating, cancellation/removal reasons, reopening, category expansion/collapse, deep links/reload, global cursor pages and events beyond the old 200-event load limit, conflict recovery, mobile/keyboard/200% zoom, group administration, inactive accounts, archive/delete protection, verified legacy snapshots and audit rollback. Service tests additionally exercise concurrency, invalid graphs, snapshot restoration into an isolated staging table and transactional persistence. Domain tests cover DST/date boundaries, transitive prerequisites and derived readiness.

Desktop and mobile screenshots are written under `.playwright/`; test fixtures are retained in the test database for inspection. Stopping the container preserves that database.
