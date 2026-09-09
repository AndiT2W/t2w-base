# Importwerkzeuge

`import-clickup-payouts.mjs` nimmt einen unveränderten ClickUp-JSON-Export entgegen. Ohne `--commit` wird ausschließlich eine Vorschau erzeugt; der Produktivlauf ist explizit:

```text
node scripts/import-clickup-payouts.mjs raw/inbox/clickup-auszahlungen.json --commit --base-url=http://127.0.0.1:3000
```

Der Import bleibt über `clickUpId` idempotent. Nicht auflösbare Eventcodes werden als `eventId = null` mit Review-Markierung gemeldet.
