---
title: Eventlisten und Tabellenwerkzeuge – Anzeigegrundlage
type: concept
status: active
updated: 2026-09-20
sources:
  - ../../src/components/t2w/DataTable.tsx
  - ../../src/components/t2w/EventTableColumns.tsx
  - ../../src/components/t2w/EventMobileList.tsx
  - ../../src/components/t2w/FilterChip.tsx
  - ../../src/routes/veranstaltungen.tsx
  - ../../src/routes/index.tsx
  - ../../src/routes/kontakte.tsx
  - ../../src/routes/hardware.tsx
  - ../../src/components/t2w/StatusBadge.tsx
  - ../../src/lib/t2w/kalender.ts
  - ../../tests/e2e/event-management.spec.ts
  - ../../tests/e2e/table-preferences.spec.ts
  - User conversation, 2026-09-19
---

# Eventlisten und Tabellenwerkzeuge – Anzeigegrundlage

## Geltung und Stand

Diese Seite hält fest, wie die Veranstaltungsliste am 19.09.2026 auf die Bildsprache der bereits
überarbeiteten Bereiche gebracht wurde und welche Regeln dabei für **alle** Tabellen der Anwendung
gesetzt wurden. Verbindlich bleiben die [PM-Designgrundlage](project-management-design.md) als
Leitbild, die [Kommunikationsanzeige](communication-display-design.md) als zweites Beispiel
derselben Sprache und der [gemeinsame Tabellenstandard](shared-compact-data-tables.md) für Kopf,
Dichte und Export. Diese Seite widerspricht keiner der drei.

Nutzerentscheidungen vom 19.09.2026, die hier gelten: die Spaltenauswahl ist keine beschriftete
Schaltfläche mehr, der Excel-Export ist ein Symbol, Spalten lassen sich umordnen, die
Aktionsspalte entfällt — und **das gleiche Tabellenlayout gilt für alle Tabellen**, ausdrücklich
auch für Kontakte und Kunden.

## Die Werkzeuge gehören der Tabelle

Spaltenauswahl und Export sind Werkzeuge der Tabelle, nicht der Seite — zwei Symbole, in jeder
Tabelle gleich. Sie stehen **am rechten Ende der Filterzeile**, auf Höhe der Filter, damit die
Tabelle keine eigene Werkzeugzeile braucht (Nutzerwunsch vom 19.09.2026: Höhe sparen).

`TableToolbar` ist die gemeinsame Definition des Symbolpaars. Eine Seite mit Filterzeile setzt sie
dort hin und gibt der Tabelle `tools="extern"`; eine Tabelle ohne Filterzeile bekommt sie
unverändert von `DataTable` in einer eigenen schmalen Zeile. Das Aussehen ist in beiden Fällen
dasselbe — nur der Platz unterscheidet sich, und zwar nach einer Regel: **rechtes Ende der Zeile
direkt über der Tabelle**.

- **Spalten** — Symbol mit dem barrierefreien Namen „Spalten auswählen" und dem Tooltip „Spalten
  auswählen und ordnen". Vorher war es eine beschriftete Schaltfläche, die je Seite woanders stand:
  bei den Filtern, über der Tabelle oder in einer Kartenkopfzeile.
- **Excel** — Symbol mit dem barrierefreien Namen „<Tabelle> als Excel exportieren". Der
  ausgeschriebene Text steckt in Name und Tooltip.

Damit bleibt es bei **einer** Kompaktzeile vor der Tabelle: links die Filter, rechts die Werkzeuge
— genau die Zeile, die der Tabellenstandard verlangt. Beide Symbole erscheinen erst ab
Desktopbreite; schmale Ansichten zeigen Karten, die weder Spalten noch Export kennen.

## Spalten sind auswählbar und ordenbar

Im Spaltenmenü steht die Liste in Anzeigereihenfolge — **oben ist links**. Sichtbare Spalten
lassen sich **ziehen**; daneben bleiben „nach links" und „nach rechts" als Schaltflächen. Ziehen
ist der Weg für die Maus, die Schaltflächen sind der Weg für Tastatur und Bildschirmleser — beide
lösen dieselbe Aktion `moveColumn` aus, damit es nur eine Quelle der Reihenfolge gibt. Die gewählte
Reihenfolge wird wie die Sichtbarkeit in der Präferenz `{ version, visible, sort }` gehalten und
überlebt das Neuladen.

Das war zur Hälfte schon gebaut: `table-model.ts` konnte `moveColumn` immer, aber nur die
Hardwaretabelle reichte es durch, und Übersicht, Veranstaltungen und Kontakte gaben ihre Zellen in
einer fest verdrahteten Reihenfolge aus statt in der von `visible`. Die Reihenfolge ließ sich also
weder einstellen noch hätte sie gewirkt. Jetzt geben alle Tabellen Kopf und Zellen über
`visibleColumns.map(…)` aus — das ist die Bedingung dafür, dass Umordnen überhaupt sichtbar wird.

## Jede Tabelle sortiert nach Inhalt

Der Kopf jeder Spalte ist ein `SortHeader`-Knopf. Bis zum 20.09.2026 galt das nur für fünf
Tabellen; Angebote, Rechnungen, Auszahlungen, Auditlog, Event-Auszahlungen, Event-Hardware und die
beiden Event-Detailtabellen waren nicht sortierbar.

Tabellen **mit** Spaltenpräferenz sortieren über `useTableBehavior` — die Sortierung wird mit
Sichtbarkeit und Reihenfolge gespeichert. Tabellen **ohne** Präferenz verwenden `useTableSort`:
nur lokaler Zustand, kein Speichern, keine Spaltenauswahl. So bekommt auch eine feste Tabelle
sortierbare Köpfe, ohne eine Präferenzkennung erfinden zu müssen.

Auswahl- und Aktionsspalten bleiben ungeordnet: sie tragen keinen Wert, nach dem man ordnen würde.

## Keine Aktionsspalte

Die Spalte „Aktion" mit dem Stift-Symbol entfällt in beiden Eventtabellen. Der Eventname ist
bereits der Weg ins Detail; ein zweites Ziel daneben trug nichts bei und kostete eine Spalte.
Outlook- und SharePoint-Links bleiben in der Ordnerspalte, die Zeile selbst wird kein Link.

## Eine Eventtabelle, zwei Seiten

Übersicht und Veranstaltungen zeigten dieselben zehn Spalten mit fast denselben Zellen in zwei
Codekopien; die Kopien waren bereits auseinandergelaufen (Terminkollision nur in einer,
Aufgabenzahl einmal als Zahl und einmal als Chip). [`EventTableColumns.tsx`](../../src/components/t2w/EventTableColumns.tsx)
hält jetzt Spaltenbestand, Sortierwerte, Kopf- und Zellinhalte einmal; beide Seiten behalten ihre
eigenen Filter, ihre Zeilenmarkierungen und ihre eigene Präferenzkennung.

Damit ist Kandidat 3 des [Architektur-Scans](../sources/2026-09-19-architecture-scan.md) für die
Darstellung eingelöst. Nicht eingelöst ist der dort ebenfalls genannte Teil: Filter, Datenauswahl
und Präferenzhaltung bleiben bei den Seiten.

## Weitere Regeln der Eventliste

- **Schnellfilter sind schaltbare Chips.** Die Übersicht zeigt ihre fünf Schnellfilter seit dem
  20.09.2026 als `ToggleChip` mit `aria-pressed`; ein zweiter Klick führt zurück auf „Alle aktiven".
  Ihr Statusfilter ist ein `FilterChip`, und „n Filter zurücksetzen" zählt beide.
- **Filter sind Auswahlchips.** Status, Zeitraum und Archiv als rundes Chip mit kleiner
  Beschriftung, nativem `select` als Wert und Markenakzent sobald gesetzt. `FilterChip`, `DateChip`
  und `FilterResetChip` liegen in [`FilterChip.tsx`](../../src/components/t2w/FilterChip.tsx); die
  Aufgabenübersicht verwendet dieselben Komponenten. Das native `select` bleibt bewusst erhalten —
  Tastatur, Bildschirmleser und die Systemauswahl auf Mobilgeräten kommen damit mit.
- **Filter zurücksetzen** ist ein Symbol mit der Anzahl (`✕ 2`); der ausgeschriebene Satz steht im
  barrierefreien Namen und im Tooltip. Die Zahl bleibt sichtbar, weil sie die einzige Stelle ist,
  an der steht, wie viele Filter gesetzt sind — PM- und Kommunikationsgrundlage schreiben sie fest.
  Bezugspunkt ist die Grundstellung der Seite (in der Eventliste: Status `alle`, Zeitraum
  `Aktuelles Jahr`, Archiv `Nur aktive`), nicht der leere Zustand. **Im leeren Zustand** bleibt der
  ausgeschriebene Satz als Schaltfläche: dort ist er der Ausweg und hat Platz, nicht nur eine
  Abkürzung am Ende einer Chipleiste.
- **Ansichten als Segmentleiste.** Liste, Kalender und Gantt in einer Kartenfläche, wie
  „Kategorien / Zeitachse" im Projektmanagement. Sie bleiben Links in einem `nav` mit
  `aria-current="page"`, damit Zurück, Lesezeichen und „in neuem Tab öffnen" funktionieren.
- **Der Zeilenrhythmus gehört dem Primitive.** Trennlinie, Hover und Zellpolster kommen aus
  `DataTable`; die Routen setzen keine zweite Linie und keinen zweiten Hover mehr darüber.
- **Mobile Karten zeigen dasselbe Event.** [`EventMobileList`](../../src/components/t2w/EventMobileList.tsx)
  trägt Sportart und Services als dieselben konfigurierten Badges wie die Tabelle. Karten bleiben
  die Darstellung für schmale Ansichten; ihr Radius bleibt `rounded-lg`, weil der Tabellenstandard
  den 12-px-Kartenradius ausdrücklich nicht auf alle Karten übertragen will.

## Statusfarben und ihre Legende

Jeder Eventstatus hat seit dem 19.09.2026 **eine eigene Farbe** (Nutzerentscheidung). Vorher trugen
Anfrage, Angebot gesendet, Akquise und Datum prüfen dasselbe Amber — der Punkt konnte den Status
nicht benennen, und eine Legende hätte vier gleich aussehende Einträge gezeigt.

| Status | Farbton | Token |
| --- | --- | --- |
| Akquise | Violett | `--status-akquise` |
| Anfrage | Amber | `--status-angefragt` |
| Angebot gesendet | Blau | `--status-angebot` |
| Datum prüfen | Neutral | `--status-datum-pruefen` |
| Zugesagt | Grün | `--status-zugesagt` |
| Abgesagt | Rot | `--status-storniert` |

Die Farbtöne stehen rund 45–90° auseinander; „Datum prüfen" bleibt bewusst neutral, weil dort noch
nichts entschieden ist. Die drei Bestandsfarben behalten ihren Wert, damit die häufigen Zustände
gleich aussehen wie bisher. Kalenderansicht und Statusbadge verwenden dieselbe Zuordnung.

**Die Farbe trägt die Bedeutung nie allein** — die Regel der PM-Grundlage gilt weiter: Der Punkt
hat Tooltip und Screenreader-Text, die Zelle nennt den Status als Text für Bildschirmleser, und
unter der Tabelle steht `StatusLegend`. Die Legende erscheint erst ab Desktopbreite; schmale
Ansichten zeigen in den Karten ohnehin Punkt und Text nebeneinander.

## Der Tabellenkopf gehört dem Tabellenstandard

`.t2w-table-header` und `.t2w-data-table > thead` teilen sich in [`styles.css`](../../src/styles.css)
dieselbe Regel: 10 px, Gewicht 700, Versalien, `0.08em` Laufweite, deckende Mischung aus `muted`
und `card`, Haarlinie als Unterkante. Vorher setzte `DataTable` seinen Kopf über eigene Utilities
und wich davon ab — sichtbar überall dort, wo eine `DataTable` neben einer handgeschriebenen
Tabelle stand.

## Abdeckung

| Tabelle | Symbolleiste | Spalten wählbar und ordenbar |
| --- | --- | --- |
| Übersicht, Veranstaltungen | auf Filterhöhe | ja, gemeinsame Spaltendefinition |
| Hardware | auf Filterhöhe | ja |
| Kontakte, Kunden | auf Höhe der Tab-Leiste | ja |
| Auszahlungen, Angebote, Rechnungen, Einstellungen, Event-Detailtabellen | eigene Zeile, nur Export | nein — feste Spalten, keine Präferenz |

Tabellen ohne Spaltenpräferenz zeigen nur das Exportsymbol; die Leiste sieht überall gleich aus.

`FilterResetChip` verwenden Aufgaben, Veranstaltungen, Kommunikation und Hardware. Hardware zählt
dafür seit dem 19.09.2026 seine gesetzten Filter, statt nur zu wissen, *dass* welche gesetzt sind.

**Kontakte und Kunden** setzen die Werkzeuge an das rechte Ende ihrer Tab-Leiste
`Kontakte | Kunden`. Dafür liegt ihr Spaltenzustand seit dem 19.09.2026 bei der Seite
(`usePeopleTable`, `useCustomerTable`) statt in den Tabellenkomponenten; diese bekommen `table` und
`tableRef` als Parameter. Es ist immer nur eine der beiden Tabellen gemountet, deshalb genügt eine
Referenz für den Export, und der Exportname wechselt mit dem Reiter. Ohne Einträge zeigt die Seite
ihren Leerzustand und die Werkzeuge entfallen, weil es nichts zu exportieren gibt.

## Offene Punkte

1. **Angebote, Rechnungen, Einstellungen und die Event-Detailtabellen** haben keine
   Spaltenpräferenz — sie sortieren, aber Sichtbarkeit und Reihenfolge ihrer Spalten sind fest.
   Ob sie eine Präferenz bekommen sollen, ist nicht entschieden.
2. Die Sortierung der Tabellen ohne Präferenz **überlebt das Neuladen nicht**; sie ist bewusst
   lokaler Zustand.

## Weiterpflege bei Änderungen

1. Vor Änderungen an einer Tabelle diese Seite, die [PM-Designgrundlage](project-management-design.md)
   und den [Tabellenstandard](shared-compact-data-tables.md) lesen.
2. Änderungen an Leiste, Kopf, Zeilen oder Chips gehören in die gemeinsamen Bausteine
   (`DataTable`, `EventTableColumns`, `FilterChip`, `styles.css`), nicht in die Route.
3. Eine neue Tabelle gibt Kopf und Zellen über `visibleColumns.map(…)` aus, sobald sie eine
   Spaltenpräferenz hat — sonst wirkt das Umordnen nicht.
4. Desktop und 375 px prüfen, dazu lange Namen, fehlende Werte, leere Liste mit und ohne gesetzten
   Filter sowie markierte Terminkollisionen.
5. [Repository-Testregel](../../AGENTS.md#feature-testing-rule) erfüllen und veraltete
   Layout-Erwartungen auf diese Seite aktualisieren, statt sie stehen zu lassen.
6. Geänderte Regeln hier mit Datum und Quelle pflegen und den [Wartungslog](../log.md) ergänzen.
