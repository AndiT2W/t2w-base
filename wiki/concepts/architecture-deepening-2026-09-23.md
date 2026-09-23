# Architekturvertiefung vom 2026-09-23

Quelle: Nutzerauftrag vom 2026-09-23, alle drei Kandidaten des an diesem Tag erstellten Architekturberichts umzusetzen. Der Bericht selbst lag nur temporär außerhalb des Repositorys; der [frühere Scan](../sources/2026-09-19-architecture-scan.md) liefert zusätzliche Evidenz für Nachfolger und Eventtabelle. Die folgenden Aussagen stützen sich auf den geänderten Code und die Regressionen.

## Nachfolger als eine Planungsintention

- Die Schnellanlage „Nachfolger“ sendet eine einzige `create-successor`-Intention. Der [PM-Dienst](../../services/event-service/src/project-management.service.ts) prüft Vorgänger, Planungsbereich und Graphversion und speichert Aufgabe, Abhängigkeit, Aktivität und Audit in einer Transaktion. Die Antwort enthält den neuen Planungsschnappschuss mit `affectedTaskId`.
- Das [Task-Interaktionsmodul](../../src/lib/t2w/task-interaction-workspace.ts) hält bei einem Fehler Eingabe und Fehlermeldung; die [Eventansicht](../../src/components/t2w/ProjectManagement.tsx) schließt die Schnelleingabe nur nach Erfolg. Die [Schnelleingabe](../../src/components/t2w/TaskCategory.tsx) leert den Titel ebenfalls nur nach Erfolg.
- Die [Datenbankintegration](../../services/event-service/src/project-management.integration.spec.ts) prüft fehlenden Vorgänger ohne Teilaufgabe sowie Kante und Historie nach Erfolg. Der [Browserablauf](../../tests/pm-e2e/project-management.spec.ts) prüft Konflikt, erneutes Senden und die Kante nach Neuladen.

## Eventkommunikationsanzeige

- Das [Kommunikationsanzeigemodul](../../src/lib/t2w/communication-display-workspace.ts) besitzt Filter, Suche, Ansichtsmodus, Konversations- und Nachrichtenauswahl sowie das Ergebnis einer Themenzuordnung. Die [Eventdetailroute](../../src/routes/events.$eventcode.tsx) rendert dessen Schnappschuss und löst die gespeicherte Eventmutation darüber aus.
- Die vorhandene [Timeline-Projektion](../../src/lib/t2w/communication-timeline.ts) und die [Anzeigegrundlage](communication-display-design.md) bleiben maßgeblich. Das Modul fügt keinen Bearbeitungsstatus hinzu.
- [Modultests](../../src/lib/t2w/communication-display-workspace.test.ts) sichern Filter, Auswahl bei wechselnden Daten und Themenzuordnung; die bestehenden Kommunikations-Browsertests prüfen die Anzeige und Persistenz nach Neuladen.

## Eventlistendarstellung

- [EventTablePresentation](../../src/components/t2w/EventTablePresentation.tsx) bündelt Sortierung, Spaltenpräferenzen, Werkzeugleiste, Desktopzeilen, mobile Karten und Terminkollisionsmarkierung. Die [Übersicht](../../src/routes/index.tsx) und [Veranstaltungsliste](../../src/routes/veranstaltungen.tsx) wählen Events weiterhin mit eigenen Filtern und behalten getrennte Präferenzkennungen.
- Die [Spalten- und Zellenregeln](../../src/components/t2w/EventTableColumns.tsx) sowie der [DataTable](../../src/components/t2w/DataTable.tsx) bleiben die bestehenden Wiederverwendungspunkte nach [ADR-0003](../../docs/adr/0003-shared-compact-data-tables.md). Der [Browser-Regressionstest](../../tests/e2e/table-preferences.spec.ts) prüft die Trennung der Präferenzen.

## Verifikation

Am 2026-09-23 bestanden: Frontend- und Backend-Typprüfung, ESLint für geänderte Dateien, 20 fokussierte Frontend-Unit-Tests, fünf PM-Datenbankintegrationstests und die gesamte PM-Browsersuite (7 Abläufe). Die Kommunikations- und Eventtabellen-Teilprüfungen bestanden laut ihren gezielten Browserläufen (2 Kommunikationsabläufe, 7 Tabellenpräferenz- und 12 Eventlistenabläufe). Die PM-Browserprüfung nutzte eine isolierte `pm_test`-Datenbank.
