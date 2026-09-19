---
title: Projektmanagement – verbindliche Designgrundlage
type: concept
status: active
updated: 2026-09-18
sources:
  - ../sources/2026-09-18-claude-pm-design.md
---

# Projektmanagement – verbindliche Designgrundlage

## Geltung

Die von Claude am 17.09.2026 überarbeitete Oberfläche ist auf Nutzerwunsch vom 18.09.2026 die Grundlage für weitere PM-Änderungen. Vor Änderungen an Event-Aufgaben, Gesamtübersicht, Zeitansichten, Aufgabenanlage oder Aufgabenpanel diese Seite lesen. Erweiterungen führen die hier beschriebenen Muster fort; eine neue Nutzerentscheidung wird mit Datum und Quelle hier eingearbeitet. [Auftrag und geprüfter Stand](../sources/2026-09-18-claude-pm-design.md)

Die fachlichen Regeln aus [PM v4](../tasks/project-management-spec-v4.md) bleiben gültig. Diese Seite ersetzt dessen frühere UI-Vorgaben und die [Aufgabenübersicht vom 15.09.2026](../decisions/2026-09-15-kontrastorientierte-aufgabenuebersicht.md). Für andere operative Listen gilt weiterhin der [gemeinsame Tabellenstandard](shared-compact-data-tables.md); seine leichtere Kopfgestaltung ist Teil der Überarbeitung.

## Visuelle Richtung

Arbeitsbreite nutzen, Inhalte kompakt halten, helle Kartenflächen und dünne Trennlinien verwenden. Typografie, Ausrichtung und semantische Akzente strukturieren den Inhalt. Kleine Beschriftungen ordnen ein, Aufgabentitel tragen die Aufmerksamkeit. Zustandsfarben immer durch Text ergänzen. Die vorhandene Schrift `Source Sans 3`, die TIME2WIN-Markenfarben und die linke Navigation bleiben der Rahmen. [Stile](../../src/styles.css), [Branding](time2win-ci-branding.md)

Die beiden Einstiege beantworten unterschiedliche Fragen:

| Einstieg | Aufgabe der Ansicht | Grundstruktur |
| --- | --- | --- |
| Event → Projektmanagement | Wie weit sind die Bereiche dieses Events, was kommt als Nächstes? | Zusammenfassung → Kategorien / Zeitachse → gemeinsames Aufgabenpanel |
| `/aufgaben` | Was ist über alle Events und globale Aufgaben hinweg dringend? | Ansichtsaktionen → Filterchips → Dringlichkeitsfilter → flache Aufgabenliste |

Referenzen: [Event-Workspace](../../src/components/t2w/ProjectManagement.tsx), [Gesamtübersicht](../../src/routes/aufgaben.tsx).

## Event: Fortschritt und Abläufe

- Oben stehen Aufgabenüberschrift, Link zur Gesamtübersicht und „Neue Aufgabe“. Die kompakte Zusammenfassung zeigt erledigt/gesamt, einen segmentierten Fortschrittsbalken, beschriftete Zähler und bei bekanntem Eventstart den Tagesabstand zum Event. Sie zählt alle Aufgaben, unabhängig von aufgeklappten Kategorien.
- „Kategorien“ ist der Einstieg; „Zeitachse“ die zweite Ansicht. Die Auswahl erscheint als Segmentleiste.
- Kategorien stehen als flache Zeilen in einer gemeinsamen Karte. Jede Zeile zeigt Kategorie, Fortschritt, nächsten Schritt im Klartext, nächste Frist und gegebenenfalls die zuständige Person. Überfälligkeit erhält eine rote linke Kante und eine dezente rote Fläche.
- Kategorien starten geschlossen; jeweils eine Kategorie ist geöffnet. Der ganze Kategorienkopf ist ein Button mit `aria-expanded`.
- Verbundene Aufgaben erscheinen als horizontale Ablaufketten mit Pfeilen. Parallele Aufgaben stehen innerhalb derselben Stufe untereinander. Lange Ketten scrollen horizontal und behalten ihre Leserichtung. Erledigte Anfangsstufen werden zusammengefasst; eine vollständig erledigte Kette behält ihre letzte Stufe sichtbar.
- Kategorieübergreifende Vorgänger erscheinen an dargestellten Ketten als blasse, gestrichelte Karten mit „aus …“. Einzelaufgaben stehen separat in einer kompakten Tabelle mit Aufgabe, Zustand, Fälligkeit und Person. Die Darstellung erzeugt keine zusätzlichen fachlichen Abhängigkeiten.

Referenzen: [TaskSummary](../../src/components/t2w/TaskSummary.tsx), [TaskCategory](../../src/components/t2w/TaskCategory.tsx), [Ablaufdarstellung](../../src/lib/t2w/task-flow-view.ts). Aktuelle Begrenzungen der sichtbaren Aufgaben sind im [Quellnachweis](../sources/2026-09-18-claude-pm-design.md) festgehalten.

## Aufgaben im Kontext anlegen

### Kategorien zentral pflegen

Unter **Einstellungen → Auswahllisten → Projektmanagement / Aufgaben** werden gemeinsame Aufgabenkategorien angelegt, umbenannt, aktiviert/deaktiviert und sortiert. Zusätzlich lassen sich ein Symbol und eine Farbe aus derselben visuellen Palette wie bei den übrigen Auswahllisten hinterlegen. Die Darstellung erscheint zusammen mit dem weiterhin sichtbaren Kategorienamen in Event-Kategorien, Zeitansichten, Aufgabenpanel und globaler Aufgabenübersicht; Farbe oder Symbol tragen die Bedeutung nie allein. Die Reihenfolge lässt sich per Ziehen oder beschrifteten Auf-/Ab-Schaltflächen ändern und gilt für Kategorieauswahl, Event-Kategorien und Zeitansichten. Namens- und Darstellungsänderungen werden ausdrücklich gespeichert; Konflikte erhalten den Entwurf und bieten erneutes Laden an. Kategorienmutationen bleiben serverseitig auf Admins beschränkt.

Inaktive Kategorien bleiben in vorhandenen Aufgaben und Filtern sichtbar; die Aufgaben bleiben bearbeitbar. Neue Zuordnungen sowie Schnellanlage/Nachfolger in einer inaktiven Kategorie sind ausgeschlossen. Quellen: Nutzerkonversation vom 2026-09-18 und 2026-09-19; [Kategorienverwaltung](../../src/components/t2w/PmCategorySettings.tsx), [PM-Service](../../services/event-service/src/project-management.service.ts), [Darstellungskomponente](../../src/components/t2w/ServiceBadge.tsx), [Domain-Regeln](../../packages/domain/src/project-management.ts), [Browser-Regression](../../tests/pm-e2e/category-settings.spec.ts).

### Erfassungswege

| Weg | Übernommener Kontext | Interaktion |
| --- | --- | --- |
| Schnellzeile in geöffneter Kategorie | Event und Kategorie | Titel + Enter/„Anlegen“; Eingabe bleibt für die nächste Aufgabe verfügbar |
| „Nachfolger“ am Kettenende | Event, Kategorie und eindeutiger letzter Vorgänger | Nur bei einer einzelnen Aufgabe in der letzten Stufe anbieten |
| „Neue Aufgabe“ / „Globale Aufgabe anlegen“ | Event beziehungsweise globaler Planungsbereich | Gemeinsames Aufgabenpanel im Neu-Zustand |

Person und Termine bleiben ohne ausdrückliche Eingabe leer. Neue Erfassungswege verwenden dieselben Workspace-Intentionen wie bestehende Wege. Referenzen: [ProjectManagement](../../src/components/t2w/ProjectManagement.tsx), [TaskCategory](../../src/components/t2w/TaskCategory.tsx), [Aufgabenroute](../../src/routes/aufgaben.tsx).

## Gemeinsames Aufgabenpanel

- Rechts öffnendes Sheet, auf schmalen Ansichten volle Breite; Kopf und Fuß bleiben außerhalb des scrollenden Inhalts.
- Kopf: Zustandschip, Kategorie, direkt bearbeitbarer Titel und dreiteilige Statusauswahl „Offen / In Arbeit / Erledigt“.
- Verantwortliche Person, Kategorie, Start und Ende bilden auf ausreichend breiten Ansichten ein Zweispaltenraster mit sichtbaren Labels. Priorität wird als Auswahlchips dargestellt; Beschreibung folgt als Textfeld.
- Voraussetzungen erscheinen als benannte Chips mit Entfernen-Aktion. „Blockiert danach“ macht vorhandene Nachfolger sichtbar. Die fachliche Abschlussprüfung bleibt beim Workspace/Server.
- Kommentare werden im Panel bearbeitet; Löschrückfragen erscheinen am betroffenen Inhalt. Der Verlauf ist mit Anzahl aufklappbar.
- Aufgabenfelder einschließlich Status werden ausdrücklich mit „Änderungen speichern“ gespeichert. Die Fußleiste nennt ungespeicherte Felder und bietet „Verwerfen“. Voraussetzungen und Kommentare behalten ihre eigenen Aktionen. Explizites Speichern schützt zusammenhängende Entwürfe im bestehenden Versions-/Konfliktmodell.

Referenzen: [TaskDetailSheet](../../src/components/t2w/TaskDetailSheet.tsx), [Interaktionsmodul](../../src/lib/t2w/task-interaction-workspace.ts), [Modulgrenzen](task-planning-and-table-deepening-2026-09-15.md).

## Gesamtübersicht: Dringlichkeit und Filter

- Eine flache Liste gruppiert in dieser Reihenfolge: **Überfällig → Diese Woche → Blockiert → Danach → Erledigt**. Leere Gruppen entfallen. Event und Kategorie sind Spalten; Aufgaben bleiben ohne Öffnen eines Event- oder Kategoriecontainers sichtbar.
- Spalten: Aufgabe, Event, Kategorie, Zustand, Fälligkeit und Person. Ein Blockadegrund steht direkt unter dem Titel als „wartet auf …“. Erledigte Titel sind gedämpft und durchgestrichen. Auf schmalen Ansichten brechen die Zeilen um und der Desktop-Spaltenkopf entfällt.
- Gruppierung und Zustandschip haben unterschiedliche Aufgaben: Erledigte Aufgaben gehören immer zu „Erledigt“; bei offenen Aufgaben hat Überfälligkeit Vorrang vor naher Fälligkeit, danach folgt Blockade. Innerhalb einer Gruppe wird nach Enddatum sortiert, ohne Enddatum zuletzt.
- Die Beschriftung „Diese Woche“ entspricht derzeit `dueSoon`: heute bis einschließlich heute + sieben Tage, keiner Kalenderwoche. Bei Änderungen dieselbe Domain-Projektion verwenden.
- Suche, Event, Status, Person, Kategorie, Priorität, „Ende ab“ und „Ende bis“ stehen gemeinsam in einer umbrechenden Chipleiste. Auswahlchips behalten native `select`-Elemente; Datumschips native Datumseingaben. Aktive Auswahl-/Datumsfilter erhalten einen Markenakzent; „n Filter zurücksetzen“ zeigt die Anzahl gesetzter Such-/Feldfilter.
- Die drei Kennzahlen „überfällig“, „diese woche“ und „blockiert“ sind umschaltbare Dringlichkeitsfilter für die Liste. Zweiter Klick hebt den jeweiligen Fokus auf. Ihre Zähler beziehen sich auf die bereits durch Suche/Felder gefilterten Aufgaben.

Referenzen: [TaskQueue](../../src/components/t2w/TaskQueue.tsx), [Dringlichkeitslogik](../../src/lib/t2w/task-queue.ts), [Filterleiste](../../src/routes/aufgaben.tsx), [Domain-Projektion](../../packages/domain/src/project-management.ts).

## Zeitansichten

Die **Event-Zeitachse** zeigt Kategorien als Spuren und Aufgaben als beschriftete Termin-Chips anhand ihres Enddatums. Heute und Eventstart sind vertikale Bezugslinien; die Skala umfasst vorhandene Endtermine und diese Bezugspunkte. Aufgaben ohne Enddatum bleiben links unter „Ohne Termin“. Anklicken öffnet das gemeinsame Panel. [TaskTimeline](../../src/components/t2w/TaskTimeline.tsx), [Skalierung und Reihen](../../src/lib/t2w/task-timeline.ts)

Das **globale Gantt** bleibt die separate Desktop-Kalenderansicht mit drei, sechs oder zwölf Monaten, Event-/Kategoriegliederung, Balken beziehungsweise Meilensteinen und einem Bereich für Aufgaben ohne Start und Ende („Noch nicht terminiert“). Änderungen erfolgen im Panel. Seine Darstellung ist von der neuen Event-Zeitachse zu unterscheiden. [Aufgabenroute](../../src/routes/aufgaben.tsx)

## Zustände und gemeinsame Stile

| Anzeigezustand | Farbe | Einordnung |
| --- | --- | --- |
| Erledigt (`done`) | Grün | `DONE`, hat Vorrang vor den übrigen Anzeigezuständen |
| Überfällig (`overdue`) | Rot | Offene Aufgabe mit überschrittenem Ende |
| Wartet (`waiting`) | Amber | Unerledigte Vorgänger, sofern nicht bereits überfällig |
| In Arbeit (`active`) | Blau | `IN_PROGRESS`, sofern nicht überfällig oder wartend |
| Offen (`open`) | Neutralgrau | Übrige offene Aufgaben |

`taskState` leitet diese Anzeigezustände ab; das Datenmodell behält seine drei Arbeitsstatus. `TaskStateChip`, `TaskProgress` und die Tokenfamilien `--task-…`, `--task-…-soft`, `--task-…-strong` sind die Wiederverwendungspunkte. Fläche/Kante, sanfter Hintergrund und Schrift werden für Light/Dark zentral definiert. Fortschrittsbalken zeigen erledigt, in Arbeit und überfällig; wartende Aufgaben zählen zur offenen Restfläche. Referenzen: [task-state](../../src/lib/t2w/task-state.ts), [TaskState](../../src/components/t2w/TaskState.tsx), [CSS-Tokens](../../src/styles.css).

Kompakte Listenbeschriftungen verwenden die neue leichte Kopfgestaltung: 10 px, Gewicht 700, Versalien und weitere Laufweite, eine dünne Unterkante und dezente Fläche. Sticky-Tabellenköpfe bleiben deckend. Der gemeinsame `DataTable` verwendet 12 px Kartenradius; PM-Karten verwenden ihre vorhandenen `rounded-lg`-Komponenten. Diese Werte nicht pauschal auf Fließtext oder alle Karten übertragen. [Tabellenstandard](shared-compact-data-tables.md), [DataTable](../../src/components/t2w/DataTable.tsx)

## Weiterpflege bei Änderungen

1. Betroffene Einstiegspunkte anhand dieser Seite bestimmen; gemeinsame Zustände, Darstellungskomponenten und das Aufgabenpanel erweitern. Persistenz und Fachregeln bleiben in ihren bestehenden Modulen.
2. Die Änderung in Event-Kategorien, Ablaufkette, Event-Zeitachse, globaler Liste und Panel nachziehen, soweit derselbe Inhalt oder dieselbe Interaktion betroffen ist. Das globale Gantt bei Terminänderungen mitprüfen.
3. Desktop und schmale Ansicht, lange Titel, leere Kategorien, fehlende Termine/Personen, blockierte und überfällige Aufgaben sowie vollständig erledigte Abläufe prüfen. Tastaturfokus, Labels und beschriftete Zustände erhalten. Bekannte Umsetzungslücken aus dem Quellnachweis sind keine Designregeln.
4. Bei neuen Features die [Repository-Testregel](../../AGENTS.md#feature-testing-rule) erfüllen: Browserworkflow mit beobachtbarem Ergebnis und bei Speicherung Reload; reine Ableitungen zusätzlich gezielt testen. Veraltete Layout-Erwartungen auf dieses Design aktualisieren. Vorhandene Testdateien allein belegen keine bestandene Regression.
5. Geänderte Designregeln samt Quelle hier pflegen, betroffene ältere Wiki-Aussagen kennzeichnen und [Wartungslog](../log.md) ergänzen. Fertig ist die Weiterpflege, wenn alle betroffenen Ansichten und ihre Nachweise zur dokumentierten Regel passen.
