# Projektmanagement: Neuimplementierung von Issue #55

Stand: 2026-09-10. Auftrag aus Nutzerkonversation: vorherige Implementierung zurücknehmen und `/implement #55` erneut ausführen. Maßgeblich bleibt [Spezifikation v3](project-management-spec-v3.md).

## Umsetzung

- Vorherige Checkbox-/Einzelvorgänger-Erweiterung in Domain, Adapter, API, Eventseite und Tests zurückgenommen. Spezifikation, Quellen und Git-Historie bleiben erhalten. Vergleichsbasis vor der alten Implementierung: `ed49c5ca`.
- [PM-Domain](../../packages/domain/src/project-management.ts) besitzt vier Arbeitsstatus, Ende-zu-Start-Abhängigkeiten, transitive Voraussetzungen, Zeitzonen-/Fristregeln, Kategoriebeurteilung und topologisch geordnete Abläufe. Diagramm und Tabelle beschreiben dieselben Aufgaben.
- [PM-Service](../../services/event-service/src/project-management.service.ts) und [Controller](../../services/event-service/src/project-management.controller.ts) bündeln `/api/v1/pm`: konsistente Event-/Globalprojektionen, versionierte Commands, Gruppenverwaltung, Referenzen, Verlauf, Eventzeitzone und Snapshotzugriff. Eventzeile/Graphversion serialisieren operative Commands; Taskversion schützt einzelne Entwürfe. Fachmutation, Aktivität und Audit werden gemeinsam geschrieben.
- [Eventoberfläche](../../src/components/t2w/ProjectManagement.tsx) ersetzt Checkboxen durch Kategorien, Ablaufreferenzen, aufklappbare Tabelle und Sheet. Konfliktvergleich erhält eigene Eingaben; Beziehungskommandos erhalten ungespeicherte Formularfelder. [Globale Aufgaben](../../src/routes/aufgaben.tsx) lesen serverseitig vollständige Aggregate und Cursorseiten, einschließlich ungeladener Events. Filter und Auswahl bleiben in der URL.
- Taskreferenzen zeigen vorhandene Kontakte, Nachrichten, Hardwarefälle, Auszahlungen und Dateien; serverseitige Prüfung von Existenz/Eventzugehörigkeit. Keine Mutation der referenzierten Fachobjekte.

## Datenhaltung und Umstellung

- [Migration 0025](../../services/event-service/prisma/migrations/0025_project_management/migration.sql) ergänzt PM-Tabellen und Schutzregeln; [0026](../../services/event-service/prisma/migrations/0026_pm_references/migration.sql) ergänzt Fachreferenzen. `PmTask` ist die neue Aufgabenhaltung; `EventTask` bleibt für noch nicht umgestellte Legacy-Daten bestehen.
- Die zurückgenommene `0006_task_dependencies` war vor der Erstellung von `EventTask` einsortiert und scheiterte auf frischen Datenbanken. Sie wird nicht mehr ausgeliefert. Eventuell bereits vorhandene Legacy-Spalten werden nicht destruktiv entfernt; der Snapshot liest ausdrücklich alle vorhandenen Spalten.
- Vor PM-Schreibvorgängen in einem Event mit Legacy-Aufgaben muss ein Admin den Cutover ausführen: vollständiger JSON-Snapshot mit Run-ID, Anzahl, SHA-256, Autor und Abrufpfad; Prüfung und Audit vor Löschung innerhalb derselben Transaktion. Keine Übernahme alter Aufgaben in PM. Snapshots bleiben unveränderlich und nur für Admins abrufbar. Legacy-Schreibzugriffe nach Cutover werden abgewehrt.
- PM-Historie verhindert Eventlöschung; offene Aufgaben und ungeklärte terminale Voraussetzungen verhindern Archivierung. Archivierte Events sind für PM schreibgeschützt, Reaktivierung bleibt Admins vorbehalten.
- In dieser Sitzung ausschließlich lokale Testdatenbanken verändert; kein produktiver Cutover, Deployment oder Push.

## Prüfung und Grenzen

Siehe [reale Browser-Regressionen](../../tests/pm-e2e/project-management.spec.ts), [Testanleitung](../../tests/pm-e2e/README.md), [PostgreSQL-Integrationstests](../../services/event-service/src/project-management.integration.spec.ts) und [Domain-Tests](../../packages/domain/src/project-management.test.ts). Die breite bestehende Mock-Browser-Suite und der strenge Frontend-Typecheck besitzen zusätzliche Fehler außerhalb der PM-Neuimplementierung; Endergebnisse im Wartungslog.

Lokale Ergebnisse vom 10.09.2026: 8/8 PM-Browserabläufe, 53/53 Frontend-/Workspace-Tests, 25/25 Domain-Tests und 48/48 Service-Tests bestanden. Produktionsbuild und Lint der geänderten Dateien erfolgreich. Nach der abschließenden mobilen Layoutkorrektur besteht der gezielt erneut ausgeführte Mobile-/Konflikttest; Navigation und Sprachwechsel bestehen ebenfalls.

Die vollständige vorhandene Browser-Suite meldete zunächst 54 bestanden, 12 fehlgeschlagen, 1 übersprungen. Eine fehlgeschlagene Erwartung an den bisher deaktivierten Aufgaben-Menüpunkt wurde aktualisiert und gezielt erfolgreich geprüft. Alle 11 verbleibenden Fehler wurden gegen `ed49c5ca` reproduziert (Kalender/CRM/Selektoren/Auszahlung). Der strenge Frontend-Typecheck meldet 197 Diagnosen gegenüber 199 am Ausgangsstand; der normalisierte Vergleich ergibt keine neu hinzugekommenen Diagnosen.

## Review

**Standards:** Zwei unabhängige Reviewdurchgänge fanden und korrigierten eine fremde Migrationserweiterung, die Konfliktauflösung, aufgabenübergreifenden Konfliktzustand und den Verlust ungespeicherter Felder bei Beziehungskommandos. Die globale Projektion lädt Aufgaben/Kanten inzwischen gesammelt statt pro Event. Ein separates Frontend-Interaktionsmodul bleibt eine mögliche spätere Strukturverbesserung.

**Spec:** Referenzen, Ablaufreihenfolge, Ein-/Ausklappen, getrennte Datumsfilter, gemischte Fristwidersprüche sowie Finanz- und Kategorieverweise wurden gegen v3 geprüft und korrigiert. Fachregeln bleiben im gemeinsamen Domain-Modul; keine zusätzlichen Liefer-, Vorlagen- oder Automationszustände eingeführt.

Lieferzustände, Serienvorlagen, relative Fristen und n8n-Lesezugriff bleiben laut v3 spätere Inkremente. Eine produktive Datenbank mit bereits fehlgeschlagener alter Migration benötigt vor dem Deployment eine gesonderte Prüfung ihres Prisma-Migrationsstands; diese Sitzung hat keinen fremden Datenbankzustand geändert.
