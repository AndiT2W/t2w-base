# Projektmanagement v4

Stand: 2026-09-14. Quelle: Nutzerentscheidung in dieser Unterhaltung und die drei bereitgestellten UI-Referenzen.

> **UI fortgeschrieben am 2026-09-18:** Die fachlichen Regeln bleiben gültig. Für alle künftigen UI-Änderungen gilt die [PM-Designgrundlage der Claude-Überarbeitung](../concepts/project-management-design.md). Sie ersetzt die unten dokumentierten alten Ansichtsvorgaben: Event-Kategorien mit Ablaufketten und Zeitachse, globale Dringlichkeitsliste mit sichtbaren Filterchips sowie gemeinsames Aufgabenpanel.

## Aufgabe

- Eine Aufgabe ist entweder global oder unveränderlich einem Event zugeordnet.
- Sie enthält Titel, einfache Beschreibung, Status `OPEN`/`IN_PROGRESS`/`DONE`, Priorität `LOW`/`NORMAL`/`HIGH`, eine verantwortliche Person, Kategorie und optionale Start-/Endtage. Bei Eventaufgaben darf die Person auch ein Veranstalterkonto sein, das mit dem Veranstalter dieses Events verknüpft ist; globale Aufgaben bleiben intern.
- Unerledigte Vorgänger erzeugen den abgeleiteten Hinweis „Blockiert“, verhindern jedoch nur den Abschluss.
- Kommentare können vom Autor bearbeitet oder gelöscht werden. Änderungen sind im Aufgabenverlauf nachvollziehbar; eine Löschung entfernt Kommentar und dessen sichtbaren Verlauf.
- Ein Veranstalterkonto sieht ausschließlich persönlich zugewiesene Eventaufgaben mit minimalem Eventkontext. Es darf den gemeinsamen Kommentarverlauf verwenden und Aufgabenanhänge lesen beziehungsweise hochladen, aber derzeit weder Status noch andere Aufgabenfelder ändern. Neuzuweisung oder Deaktivierung entzieht den Zugriff sofort; Beiträge bleiben erhalten.
- Vor der ersten Zuweisung einer bereits befüllten Aufgabe wird sichtbar darauf hingewiesen, dass Aufgabeninhalt, Kommentare und Aufgabenanhänge mit dem Veranstalter geteilt werden.
- Der alte `EventTask`-Speicher wird beim Rollout bewusst ohne Migration entfernt. `PmTask` ist die einzige Aufgabenhaltung; Event-Schnappschüsse enthalten ausschließlich eine kompakte Readiness-Projektion.

## Ansichten vom 14.09.2026 (historischer Entwurf)

- Die Standardansicht gruppiert **Event → Kategorie**. Alle Kategorien starten geschlossen und zeigen Statuspunkt, Statuszahlen, nächsten ausführbaren Schritt, nächste Frist und Ablaufstufen. Nur Aufgaben derselben zusammenhängenden Abhängigkeitsgruppe erscheinen als Ablauf; unabhängige Aufgaben stehen getrennt unter „Weitere Aufgaben“ und werden nicht als implizite Vorgänger dargestellt.
- Das Aufklappen zeigt Tabelle oder auf Mobilgeräten Karten mit Name, Person, Ende, Priorität und Status.
- Die globale `/aufgaben`-Ansicht kombiniert Event- und globale Aufgaben. Suche, Event, Status und Person sind permanent sichtbar; Kategorie, Priorität und Endzeitraum liegen unter „Weitere Filter“.
- Gantt startet mit drei Monaten und lässt drei, sechs oder zwölf Monate wählen, gliedert Event und Kategorie und markiert terminierte Voraussetzungen als Verbindungspfeile. Start+Ende ergeben einen Balken; nur Ende einen Meilenstein; nicht geplante Aufgaben stehen separat. Änderungen erfolgen im Seitenpanel, nicht durch Ziehen.
- Die Desktop-Ganttansicht folgt einer zweigeteilten Arbeitsansicht: links bleiben Name, Status und Ende sichtbar; rechts liegen Wochen- und Tagesraster mit abgesetzten Wochenenden, Heute-Markierung, Balkenbeschriftung sowie Event- und Kategoriezwischenzeilen. Quelle: Nutzerreferenz vom 2026-09-14.

## Bewertung und Tests

- Kategoriepunkt: kritisch bei Blockade oder Überfälligkeit, gelb bis sieben Tage vor offenem Ende, blau bei laufender Arbeit, grün bei ausschließlich erledigten Aufgaben.
- Reale Browser-Regressionen prüfen geschlossene Kategorien, Ablauf/Blockade, kombinierte Übersicht, Gantt, mobile Ausblendung und den eingeschränkten Veranstalterzugang mit Kommentar und Datei-Upload nach Reload. Domain-, API- und PostgreSQL-Tests sichern Regeln, Speicherung, Kommentare, Anhänge, sofortigen Zugriffsentzug und den Schutz vor fremden Task-IDs.

Diese Angaben beschreiben den damaligen Stand. Die aktuelle Gestaltung verwendet die Anzeigezustände und Fortschrittsbalken der [Designgrundlage](../concepts/project-management-design.md); die vorhandenen Browser-Erwartungen sind teilweise veraltet. Siehe [Prüfung vom 18.09.2026](../sources/2026-09-18-claude-pm-design.md).

Verwandt: [Implementierungsnotiz](project-management-implementation.md), [v3-Historie](project-management-spec-v3.md).
