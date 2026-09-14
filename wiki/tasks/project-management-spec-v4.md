# Projektmanagement v4

Stand: 2026-09-14. Quelle: Nutzerentscheidung in dieser Unterhaltung und die drei bereitgestellten UI-Referenzen.

## Aufgabe

- Eine Aufgabe ist entweder global oder unveränderlich einem Event zugeordnet.
- Sie enthält Titel, einfache Beschreibung, Status `OPEN`/`IN_PROGRESS`/`DONE`, Priorität `LOW`/`NORMAL`/`HIGH`, eine Person, Kategorie und optionale Start-/Endtage.
- Unerledigte Vorgänger erzeugen den abgeleiteten Hinweis „Blockiert“, verhindern jedoch nur den Abschluss.
- Kommentare können vom Autor bearbeitet oder gelöscht werden. Änderungen sind im Aufgabenverlauf nachvollziehbar; eine Löschung entfernt Kommentar und dessen sichtbaren Verlauf.
- Bestehende PM-Aufgaben werden beim Rollout bewusst entfernt statt migriert. Legacy-`EventTask`-Snapshots bleiben unverändert.

## Ansichten

- Die Standardansicht gruppiert **Event → Kategorie**. Alle Kategorien starten geschlossen und zeigen Statuspunkt, Statuszahlen, nächsten ausführbaren Schritt, nächste Frist und Ablaufstufen.
- Das Aufklappen zeigt Tabelle oder auf Mobilgeräten Karten mit Name, Person, Ende, Priorität und Status.
- Die globale `/aufgaben`-Ansicht kombiniert Event- und globale Aufgaben. Suche, Event, Status und Person sind permanent sichtbar; Kategorie, Priorität und Endzeitraum liegen unter „Weitere Filter“.
- Gantt startet mit drei Monaten und lässt drei, sechs oder zwölf Monate wählen, gliedert Event und Kategorie und markiert terminierte Voraussetzungen als Verbindungspfeile. Start+Ende ergeben einen Balken; nur Ende einen Meilenstein; nicht geplante Aufgaben stehen separat. Änderungen erfolgen im Seitenpanel, nicht durch Ziehen.
- Die Desktop-Ganttansicht folgt einer zweigeteilten Arbeitsansicht: links bleiben Name, Status und Ende sichtbar; rechts liegen Wochen- und Tagesraster mit abgesetzten Wochenenden, Heute-Markierung, Balkenbeschriftung sowie Event- und Kategoriezwischenzeilen. Quelle: Nutzerreferenz vom 2026-09-14.

## Bewertung und Tests

- Kategoriepunkt: kritisch bei Blockade oder Überfälligkeit, gelb bis sieben Tage vor offenem Ende, blau bei laufender Arbeit, grün bei ausschließlich erledigten Aufgaben.
- Reale Browser-Regressionen prüfen geschlossene Kategorien, Ablauf/Blockade, kombinierte Übersicht, Gantt und mobile Ausblendung. Domain- und PostgreSQL-Tests sichern Regeln, Speicherung, Kommentare und Löschen.

Verwandt: [Implementierungsnotiz](project-management-implementation.md), [v3-Historie](project-management-spec-v3.md).
