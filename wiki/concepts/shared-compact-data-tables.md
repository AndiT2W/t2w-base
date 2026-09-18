---
title: Gemeinsame kompakte Datentabellen
type: concept
status: active
updated: 2026-09-18
sources:
  - ../sources/2026-09-18-claude-pm-design.md
  - ../../src/styles.css
  - ../../src/components/t2w/DataTable.tsx
  - ../../src/components/t2w/PageHeader.tsx
  - ../../src/components/ui/table.tsx
  - ../../src/styles.css
  - ../../src/components/t2w/table-model.ts
  - ../../src/components/t2w/ProjectManagement.tsx
  - ../../src/routes/aufgaben.tsx
  - ../../src/routes/index.tsx
  - ../../src/routes/veranstaltungen.tsx
  - ../../src/routes/kontakte.tsx
  - ../../src/routes/hardware.tsx
  - ../../src/routes/auszahlungen.tsx
  - ../../src/routes/einstellungen.tsx
  - ../../src/routes/angebote.tsx
  - ../../src/routes/rechnungen.tsx
  - ../../src/routes/events.$eventcode.tsx
  - ../../src/components/t2w/HardwareWorkspace.tsx
  - ../../src/components/t2w/PayoutsPanel.tsx
  - ../../src/lib/t2w/format.ts
  - ../../services/event-service/src/table-preferences.controller.ts
  - ../../services/event-service/prisma/schema.prisma
  - ../../docs/adr/0003-shared-compact-data-tables.md
  - ../../tests/e2e/table-preferences.spec.ts
  - User conversation, 2026-09-14
  - User conversation, 2026-09-15
---

# Gemeinsame kompakte Datentabellen

## Verbindlicher Desktopstandard

- Kopfzeile: 30 px; Datenzeile: 34 px; Zellentext: 13 px.
- Inhalte einer Zelle bleiben einzeilig und werden bei Bedarf gekürzt.
- Statuskennzeichen sind rechteckig-kompakt (11 px); Hover und Tastaturfokus bleiben sichtbar.
- Mobile Eventlisten nutzen Karten; vollständige Detailtabellen dürfen horizontal scrollen.
- Beim vertikalen Scrollen bleiben der Seitenkopf mit Suche und der Tabellenkopf sichtbar. Der Tabellenkopf wird dynamisch direkt unterhalb des sticky Seitenkopfs positioniert. Auf schmaleren Viewports bleibt der horizontale Tabellen-Scroller erhalten; ab Desktopbreite wird dessen Overflow freigegeben, damit der Tabellenkopf am Seiten-Viewport haftet und keine Tabellenzeilen überlagert.

## Kontrast und visuelle Hierarchie

Seit der Claude-Überarbeitung vom 17.09.2026 gilt eine leichtere Kopfgestaltung: 10-px-Beschriftung, Gewicht 700, Versalien, `0.08em` Laufweite und 1-px-Unterkante. `.t2w-table-header` verwendet eine dezente, deckende Mischung aus `muted` und `card`; dadurch bleiben beim Sticky-Scrollen darunterliegende Zeilen verdeckt. `DataTable` verwendet einen Kartenradius von 12 px. Kopf- und Zeilenhöhen des kompakten Desktopstandards bleiben erhalten. Quellen: [CSS](../../src/styles.css), [DataTable](../../src/components/t2w/DataTable.tsx), [bestätigte Designgrundlage](project-management-design.md).

**Historie:** Die am 15.09.2026 bestätigte Variante „Ausgewogen“ verwendete einen grauen Kopf, dunkle 12-px-Beschriftung ohne Versalsatz und 2-px-Unterkante. Diese optischen Vorgaben sind ersetzt. Der [Browser-Test](../../tests/e2e/table-preferences.spec.ts) enthält noch Erwartungen an diesen alten Stand; er belegt die neue Gestaltung noch nicht.

## Zustands- und Persistenzmodell

`DataTable` und `table-model.ts` kapseln stabile Sortierung, sichere Wiederherstellung sichtbarer Spalten und die Präferenzform `{ version, visible, sort }`. Die Reihenfolge in `visible` ist zugleich die Anzeigereihenfolge. Unbekannte Spalten werden verworfen.

Die Servertabelle `UserTablePreference` ist je `(userId, tableId)` eindeutig. Der geschützte Endpunkt gibt ausschließlich die Präferenz des angemeldeten Benutzers zurück. Ein bestehender Browserwert wird nur dann hochgeladen, wenn der Benutzer noch keine serverseitige Präferenz besitzt.

## Excel-Export

Jede gemeinsame `DataTable` verwendet einen fachlichen Exportnamen und bietet die beschriftete Aktion `Excel exportieren`. Die erzeugte `.xlsx`-Arbeitsmappe übernimmt den aktuellen sichtbaren Tabellenstand einschließlich Filter, Sortierung, Spaltenauswahl und bearbeiteter Eingabewerte. Reine Auswahl- und Aktionsspalten werden ausgelassen. Der Auditlog behält seinen bestehenden CSV-Export zusätzlich. Die PM-Überarbeitung verwendet eigene Darstellungen ohne diesen Export; diese Abweichung vom allgemeinen Tabellen-/Exportziel ist im [Quellnachweis](../sources/2026-09-18-claude-pm-design.md) festgehalten.

`exportName` ist ein verpflichtender Teil des `DataTable`-Vertrags. Dadurch kann eine neue Tabelle nicht über das gemeinsame Primitive angelegt werden, ohne zugleich einen Excel-Export zu benennen. Die Browser-Regression lädt die Arbeitsmappe herunter und liest Kopfzeile sowie einen bekannten Eventwert wieder ein.

## Abdeckung

`DataTable` wird in Übersichts-, Veranstaltungs-, Kontakt-/Kunden-, Hardware-, Auszahlungs-, Angebots- und Rechnungslisten sowie in operativen Event-Detailtabellen genutzt. Der Modulvertrag setzt Kopfzeilen-, Zeilen-, Zellen-, Fokus- und Exportverhalten zentral durch; Routen behalten nur ihre fachlichen Filter und Zellinhalte. Die Event-Aufgaben verwenden inzwischen Kategorienzeilen, Ablaufketten und eine eigene kompakte Einzelaufgabentabelle; die globale Aufgabenübersicht ist eine flache Liste nach Dringlichkeit. Beide folgen der [PM-Designgrundlage](project-management-design.md).

Die Eventtabellen in Übersicht und Veranstaltungen zeigen Sportart und Services als getrennte, sortierbare Spalten. Beide verwenden die konfigurierten Auswahl-Badges wie die Event-Stammdaten. Jeder Service hat ein eigenes Badge in der Services-Zelle; bei langen Werten ist der vollständige Text als Tooltip verfügbar. Die Statusspalte zeigt nur den Punkt und ist auf 3 rem begrenzt; die sichtbare Kurzform `St.` behält den Sortierknopf mit dem zugänglichen Namen `Status sortieren`. Der volle Status bleibt für Screenreader als Text verfügbar. Die sortierbare TIME2WIN-Spalte steht direkt zwischen Status und Event, ist auf 3,5 rem begrenzt, zeigt das TIME2WIN-Logo im Kopf und verlinkt eine vorhandene Event-ID auf das zugehörige Backend-Event. Siehe [Übersicht](../../src/routes/index.tsx), [Veranstaltungen](../../src/routes/veranstaltungen.tsx) und [Browser-Regression](../../tests/e2e/event-management.spec.ts).

## Dichte Arbeitsseiten (Variante A)

Die Nutzerentscheidung vom 2026-09-15 legt die A-Richtung für die Inhaltsseiten fest: Die bestehende linke Navigation bleibt, der Arbeitsbereich nutzt seine verfügbare Breite und zeigt Inhalte als dichte, unmittelbar sichtbare Listen. Kennzahlen sind eine schmale Zeile statt großflächiger Karten; Filter und Listenaktionen stehen in einer abgesetzten Kompaktzeile vor der Tabelle.

Die globale Aufgabenübersicht zeigt seit der Überarbeitung vom 17.09.2026 eine direkt sichtbare Liste nach Dringlichkeit mit umbrechenden Filterchips. Das gemeinsame `TaskDetailSheet` wurde ebenfalls überarbeitet; Gantt bleibt eine eigene Desktopansicht. Die PM-spezifischen Regeln einschließlich schmaler Ansichten stehen in der [PM-Designgrundlage](project-management-design.md).

Hardware, Auszahlungen, Veranstaltungen, Kontakte und Übersicht verwenden dieselbe vertikale Hierarchie. Einstellungen bleiben formularorientiert, füllen aber die Arbeitsbreite statt sie auf eine schmale Lesespalte zu begrenzen.

## Einzelzellenbearbeitung

Inline-Editing folgt dem ClickUp-artigen Zellmodell: Es ist immer nur die aktive Zelle im Bearbeitungsmodus; die übrigen Zellen derselben Zeile behalten ihre kompakte Anzeige und die Spaltenbreiten verändern sich nicht. `Tab` speichert die aktive Zelle und öffnet die nächste bearbeitbare Zelle derselben Zeile, `Shift+Tab` entsprechend die vorherige. `Escape` verwirft die aktuelle Zelländerung. Diese Nutzerentscheidung ersetzt für die Hardwaretabelle den bisherigen Ansatz, beim Klick alle Felder einer Zeile gleichzeitig als Eingaben darzustellen. Quelle: Nutzerkonversation vom 2026-09-15.

## Einheitliches Datumsformat

Vollständige sichtbare Datumswerte verwenden zentral `formatDatum` und erscheinen als `dd.mm.yyyy`. Zeitstempel ergänzen die Uhrzeit erst nach diesem vollständigen Datum. Das gilt auch für Zeiträume, Aufgaben, Hardware, Auszahlungen, Kommunikation, Auditlog und Änderungsverlauf; ISO-Werte bleiben das Daten- und Eingabeformat. Die neue [PM-Event-Zeitachse](../../src/components/t2w/TaskTimeline.tsx) verwendet für ihre Skala kurze Tages-/Monatslabels; volle Aufgabentermine stehen im Tooltip beziehungsweise Aufgabenpanel. Diese Ausnahme ist im [Design-Quellnachweis](../sources/2026-09-18-claude-pm-design.md) festgehalten.

Siehe auch [Aufgabenplanung und Tabellen-Vertiefung](task-planning-and-table-deepening-2026-09-15.md).
