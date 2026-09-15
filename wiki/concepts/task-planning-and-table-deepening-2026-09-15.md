---
title: Aufgabenplanung und Tabellen-Vertiefung
type: concept
status: active
updated: 2026-09-15
sources:
  - ../../CONTEXT.md
  - ../../packages/domain/src/project-management.ts
  - ../../src/lib/t2w/task-interaction-workspace.ts
  - ../../src/lib/t2w/project-management.ts
  - ../../src/components/t2w/TaskDetailSheet.tsx
  - ../../src/components/t2w/DataTable.tsx
  - ../../tests/pm-e2e/project-management.spec.ts
  - User conversation, 2026-09-15
---

# Aufgabenplanung und Tabellen-Vertiefung

## Entscheidungen

- `projectTaskFlows` in `@t2w/domain` ist die kanonische Projektion eines Aufgabenablaufs. Verbundene Aufgaben behalten ihre parallelen Stufen; unabhängige Aufgaben derselben Kategorie bleiben getrennte Abläufe.
- Der Task-Interaction-Workspace besitzt die fachnahen Bearbeitungsintentionen für Erstellen, Ändern, Voraussetzungen, Kommentare und Löschen sowie Auswahl, Draft, Ladezustand und Historie. HTTP- und In-Memory-Adapter kapseln Transport, Versionen und Persistenzpfade. Eine verspätete Historie darf weder eine neuere Auswahl noch ein bereits geschlossenes Detail überschreiben.
- `TaskDetailSheet` besitzt die gemeinsame Bearbeitungsinteraktion für Event- und Gesamtansicht: Felder, Voraussetzungen, Kommentare, Verlauf und Löschen. Die aufrufende Ansicht liefert nur Task-Interaction-Workspace, Planungskontext und Ansichtstyp; die Detailansicht grenzt Vorgänger selbst auf denselben Planungsbereich ein. Event-Aufgaben behalten die graph-versionierte Speicherung.
- Die Gesamtansicht sendet jede Task-Intention über den globalen Task-Adapter. Der Server bestimmt für Event-Aufgaben den Event-Pfad und die aktuelle Graph-Version; die Browseransicht kennt diese Persistenzverzweigung nicht.
- `DataTable` bündelt den kompakten Tabellenvertrag und das Tabellenverhalten (Spaltenauswahl, Sortierung und persistierte Präferenzen). Übersicht, Veranstaltungen, Hardware, Auszahlungen sowie beide Aufgabenlisten verwenden denselben Vertrag.

## Verifikation

- Domain-Test trennt unabhängige Aufgaben von verbundenen Abläufen.
- Der PM-Browsertest bearbeitet dieselbe Event-Aufgabe in Event- und Gesamtansicht, kommentiert sie und prüft die Persistenz nach Reload.
- Der Workspace-Test prüft, dass bei schnellem Wechsel oder Schließen eines Details keine verspätete Historie einer anderen Aufgabe sichtbar wird.
- Lokale Workspace-Tests, Domain-Tests, Produktionsbuild und die PM-Browser-Suite sind erfolgreich.

## Related Pages

- [Event Management Task Model](event-management-task-model.md)
- [Gemeinsame kompakte Datentabellen](shared-compact-data-tables.md)
- [Projektmanagement: Neuimplementierung und Testbetrieb](../tasks/project-management-implementation.md)
