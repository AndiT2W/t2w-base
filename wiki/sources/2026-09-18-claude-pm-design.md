# Quelle: Claude-Überarbeitung des Projektmanagements

## Auftrag und Stand

Nutzerkonversation vom 18.09.2026: Die durch Claude überarbeitete Projektmanagement-Anzeige ansehen und als Designgrundlage in das LLM-Wiki übernehmen, damit weitere Änderungen entsprechend nachgezogen werden. Daraus folgt die [verbindliche PM-Designgrundlage](../concepts/project-management-design.md).

Geprüft wurde der Repository-Stand `fb9ea2d6` vom 18.09.2026. Die folgenden Design-Commits vom 17.09.2026 enthalten jeweils `Co-Authored-By: Claude Opus 5`; ihre Änderungen sind in diesem Stand enthalten. Die Implementierung ist die vorhandene Primärquelle im Repository.

| Commit | Inhalt |
| --- | --- |
| `2be96af8` | Kategorienzeilen, Fortschritt, Ablaufketten, semantische Aufgabenzustände |
| `6ac5a962` | Neu aufgebautes Aufgaben-Sheet mit explizitem Speichern |
| `51aa77b2` | Kontextbezogene Schnellanlage und Nachfolgeranlage |
| `82fde867` | Event-Zeitachse |
| `ff03bfcb` | Globale Aufgabenliste nach Dringlichkeit |
| `c31ec65d` | Leichtere Spaltenköpfe und DataTable-Kartenradius |
| `1fb29066` | Sichtbare Filterchips statt aufklappbarem Formularblock |

## Sichtprüfung und Verifikation

Am 18.09.2026 wurden die laufende [Gesamtübersicht](https://base.time2win.cloud/aufgaben), die geschlossenen und geöffneten Kategorien des [Event-Projektmanagements](https://base.time2win.cloud/events/260927_kaiserlauf?tab=aufgaben), das Aufgabenpanel und die Event-Zeitachse im Browser angesehen und mit dem Code abgeglichen. Die Stichprobe betrifft die Desktopansicht im hellen Modus; sie ist keine vollständige Prüfung von Mobile, Dark Mode oder Barrierefreiheit. Es wurden keine Aufgaben angelegt oder gespeichert.

Gezielt ausgeführt: `npx --no-install vitest run src/lib/t2w/task-state.test.ts src/lib/t2w/task-flow-view.test.ts src/lib/t2w/task-timeline.test.ts src/lib/t2w/task-queue.test.ts` — **4 Dateien, 50 Tests bestanden**.

## Abweichungen und Grenzen

- Die ältere [Entscheidung zur Aufgabenübersicht](../decisions/2026-09-15-kontrastorientierte-aufgabenuebersicht.md) fordert Event-Köpfe und Kategorienkarten. Sie wird für die globale Liste durch Dringlichkeitsgruppen ersetzt. Die frühere schwere Tabellenkopfgestaltung wird durch den aktuellen [Tabellenstandard](../concepts/shared-compact-data-tables.md) abgelöst.
- Die [PM-Browser-Suite](../../tests/pm-e2e/project-management.spec.ts) enthält noch Erwartungen an Event-/Kategoriegruppen, „Weitere Filter“ und die frühere Aufgabentabelle. Der [Tabellen-Browsertest](../../tests/e2e/table-preferences.spec.ts) erwartet noch 12-px-Köpfe ohne Versalien und 2-px-Unterkante. Diese Browsertests wurden hier nicht ausgeführt; ihre alten Erwartungen müssen bei der nächsten UI-Testpflege angepasst werden.
- [TaskCategory](../../src/components/t2w/TaskCategory.tsx) begrenzt Einzelaufgaben derzeit auf sechs Zeilen und Ablaufstufen auf drei sichtbare Aufgaben; weitere werden nur gezählt. Zusammengefasste erledigte Anfangsstufen sind ebenfalls nicht aufklappbar. Das ist eine aktuelle Zugriffslücke, kein Auftrag, Aufgaben dauerhaft unzugänglich zu halten.
- PM-Einzelaufgaben verwenden derzeit eine eigene Tabelle und die globale Queue Flex-Zeilen. Sie nutzen weder `DataTable` noch dessen Excel-Export. Die frühere pauschale Aussage, beide Aufgabenlisten erfüllten den gemeinsamen Tabellen-/Exportvertrag, trifft auf diesen Stand nicht zu; eine künftige Vereinheitlichung muss die PM-Informationsarchitektur erhalten.
- Die [Event-Zeitachse](../../src/components/t2w/TaskTimeline.tsx) verwendet kurze Achsenlabels wie „19. Sep.“; volle Termine bleiben in Tooltips beziehungsweise Aufgabenfeldern verfügbar. Dies ist eine dokumentierte Ausnahme zur pauschalen alten Datumsformat-Aussage, keine allgemeine Änderung des Formats `dd.mm.yyyy`.
- „Diese Woche“ bedeutet im [Domain-Code](../../packages/domain/src/project-management.ts) heute bis heute + sieben Tage. Die [Suche](../../src/routes/aufgaben.tsx) prüft derzeit Titel und Eventnamen; der Platzhalter nennt zusätzlich „Person“, obwohl Personen nur über den separaten Filter gewählt werden. Beschriftung und Verhalten bei einer späteren Korrektur angleichen.

Diese Dokumentationsänderung führt keine UI-Funktion ein. Künftige funktionale Änderungen benötigen die Regression nach [AGENTS.md](../../AGENTS.md#feature-testing-rule).
