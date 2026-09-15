---
title: Produktionsabsturz der Aufgabenübersicht
type: source
status: confirmed
updated: 2026-09-15
sources:
  - User conversation, 2026-09-15
  - https://base.time2win.cloud/aufgaben
  - ../../src/routes/aufgaben.tsx
  - ../../src/lib/t2w/task-interaction-workspace.ts
---

# Produktionsabsturz der Aufgabenübersicht

## Beobachtung

- `/aufgaben` zeigte in Produktion den globalen Fehlerzustand „Diese Seite konnte nicht geladen werden“.
- Die Browserkonsole meldete `TypeError: t is not a function` in `useSyncExternalStore` mit dem Aufrufpfad über das ausgelieferte Aufgaben-Chunk.
- Die zusätzliche Meldung über einen vorzeitig geschlossenen Message-Channel stammt aus dem Browser-/Erweiterungskontext und ist nicht die Ursache des React-Absturzes.

## Bestätigte Ursache

Das ausgelieferte Aufgaben-Chunk übergab `interaction.getSnapshot` zweimal an `useSyncExternalStore`. Der gleichzeitig ausgelieferte Task-Interaction-Workspace besitzt ausschließlich die Methode `snapshot()`. React erhielt damit `undefined` statt einer Snapshot-Funktion.

Der lokale Arbeitsstand verwendet in [der Aufgabenroute](../../src/routes/aufgaben.tsx) `interaction.snapshot` und stimmt damit mit dem Vertrag in [Task Interaction Workspace](../../src/lib/t2w/task-interaction-workspace.ts) überein.

## Verifikation und Grenze

- Der gezielte PM-Browsertest für die kombinierte Aufgabenübersicht bestand lokal gegen Vite und den echten Event-Service/PostgreSQL-Pfad.
- Der lokale Produktionsbuild bestand; sein Aufgaben-Chunk enthält `useSyncExternalStore(..., B.snapshot, B.snapshot)` und kein `getSnapshot`.
- Die Produktionsseite blieb zum Diagnosezeitpunkt auf dem fehlerhaften Bundle. Behebung in Produktion erfordert einen neuen Deploy des korrigierten Arbeitsstands.
