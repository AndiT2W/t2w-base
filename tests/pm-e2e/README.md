# Project-management persistence tests

These Playwright tests run Chromium against the real Vite UI, NestJS API and PostgreSQL. PM requests are not mocked. Use a disposable database whose name begins with `pm_`; fixtures remain there for inspection.

```powershell
docker run -d --name t2w-pm-tests -e POSTGRES_USER=pm_test -e POSTGRES_PASSWORD=pm-test-only -e POSTGRES_DB=pm_test -p 127.0.0.1:15455:5432 postgres:16-alpine
$env:PM_TEST_DATABASE_URL='postgresql://pm_test:pm-test-only@127.0.0.1:15455/pm_test'
$env:DATABASE_URL=$env:PM_TEST_DATABASE_URL
npm run build:domain
npm run prisma:generate --workspace t2w-event-service
npx prisma migrate deploy --schema services/event-service/prisma/schema.prisma
npm run build --workspace t2w-event-service
npx playwright test --config playwright.pm.config.ts
```

The configuration starts the API on port 3015 and the frontend on port 4175. `PM_API_PROXY` enables the local proxy for this run. Do not rebuild application files while the browser tests run because a Vite restart interrupts requests.

Coverage includes the task chain **design anfordern → design einrichten → drucken**, derived blocking, initially closed categories and their table expansion, global/event aggregation, permanent and additional filters, the read-only desktop Gantt and its absence on mobile. Domain and service regressions cover the model rules, permissions, cycles, comments, activities and deletion behavior.
