---
title: Persistente Einstellungen und Browser-Regressionstests
type: concept
status: active
updated: 2026-08-20
sources:
  - ../../services/event-service/prisma/schema.prisma
  - ../../services/event-service/src/settings.controller.ts
  - ../../src/routes/einstellungen.tsx
  - ../../tests/e2e/event-management.spec.ts
  - https://github.com/AndiT2W/t2w-base/issues/24
---

# Persistente Einstellungen und Browser-Regressionstests

## Fachliche Regel

Einstellungen für Outlook- und SharePoint-Ordner sind serverseitige Stammdaten. Sie dürfen nicht aus Demo-Daten oder `localStorage` stammen. Nach dem Speichern müssen sie nach einem vollständigen Seitenreload wieder aus dem Event-Service geladen werden.

Gespeichert werden insbesondere:

- Outlook-Stammordner und optionale Outlook-Jahresordner
- SharePoint-Jahres-Sites mit Jahr und URL
- die Sortierung der SharePoint-Jahres-Sites nach Jahr absteigend

## Technische Regel

Der Event-Service stellt eine geschützte `GET/PATCH /api/v1/settings`-API bereit. Die Daten liegen in der PostgreSQL-Tabelle `AppSettings` und werden per Prisma-Migration angelegt. Das Frontend lädt Einstellungen asynchron und muss lokale Formularzustände nach dem Laden synchronisieren, bevor ein Speichern möglich ist.

Ein häufiger Fehler ist ein Formular, das mit leeren Defaults initialisiert wird, während der API-Request noch läuft. Ohne Synchronisierung überschreibt der erste Speichervorgang die bereits geladenen Werte mit diesen Defaults. Deshalb gehören asynchrones Laden, Formular-Synchronisierung und Speichern in denselben Regressionstest.

## Verbindliche Testregel

Jedes zusätzliche Feature benötigt mindestens einen Regressionstest. Für persistente UI-Funktionen ist ein echter Browser-E2E-Test der bevorzugte Standard:

1. Einstellungen über die Oberfläche öffnen.
2. Einen vorhandenen und einen neuen Jahresordner anzeigen bzw. eingeben.
3. Über den echten Speichern-Button speichern.
4. Den tatsächlichen PATCH-Request und seine vollständige Payload prüfen.
5. Die Werte nach Reload erneut über die Oberfläche prüfen; dafür muss der Testserver den Backend-Zustand zwischen Requests behalten oder gegen eine Testdatenbank laufen.

Ein Test, der den PATCH nur per `page.evaluate(fetch(...))` aufruft, ist unzureichend, weil er die Formularinitialisierung, React-State-Synchronisierung und den Benutzerablauf umgeht.

## Belege und Status

Die Persistenz wurde in Issue [#24](https://github.com/AndiT2W/t2w-base/issues/24) umgesetzt. Der nachträglich gefundene Race-/State-Fehler beim asynchronen Laden wurde mit einer Synchronisierung des Einstellungen-Formulars behoben. Der Browser-E2E-Lauf deckt den echten UI-Speichervorgang ab.
