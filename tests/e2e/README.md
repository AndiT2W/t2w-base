# Browser E2E tests

Run the Playwright suite with:

```bash
npm run test:e2e
```

The suite starts the Vite dev server, drives Chromium against the real UI, and intercepts the event API at the browser boundary with deterministic fixtures. It covers API-backed overview loading, event creation through `POST`, and detail-page persistence through `PATCH`.
