---
title: Gemeinsame kompakte Datentabellen
type: concept
status: active
updated: 2026-09-15
sources:
  - ../../src/components/t2w/DataTable.tsx
  - ../../src/components/t2w/table-model.ts
  - ../../src/components/t2w/ProjectManagement.tsx
  - ../../src/routes/aufgaben.tsx
  - ../../src/routes/index.tsx
  - ../../src/routes/veranstaltungen.tsx
  - ../../src/routes/kontakte.tsx
  - ../../src/routes/hardware.tsx
  - ../../src/routes/auszahlungen.tsx
  - ../../src/routes/einstellungen.tsx
  - ../../src/lib/t2w/format.ts
  - ../../services/event-service/src/table-preferences.controller.ts
  - ../../services/event-service/prisma/schema.prisma
  - ../../docs/adr/0003-shared-compact-data-tables.md
  - User conversation, 2026-09-14
  - User conversation, 2026-09-15
---

# Gemeinsame kompakte Datentabellen

## Verbindlicher Desktopstandard

- Kopfzeile: 30 px; Datenzeile: 34 px; Zellentext: 13 px.
- Inhalte einer Zelle bleiben einzeilig und werden bei Bedarf gekürzt.
- Statuskennzeichen sind rechteckig-kompakt (11 px); Hover und Tastaturfokus bleiben sichtbar.
- Mobile Eventlisten nutzen Karten; vollständige Detailtabellen dürfen horizontal scrollen.

## Zustands- und Persistenzmodell

`DataTable` und `table-model.ts` kapseln stabile Sortierung, sichere Wiederherstellung sichtbarer Spalten und die Präferenzform `{ version, visible, sort }`. Die Reihenfolge in `visible` ist zugleich die Anzeigereihenfolge. Unbekannte Spalten werden verworfen.

Die Servertabelle `UserTablePreference` ist je `(userId, tableId)` eindeutig. Der geschützte Endpunkt gibt ausschließlich die Präferenz des angemeldeten Benutzers zurück. Ein bestehender Browserwert wird nur dann hochgeladen, wenn der Benutzer noch keine serverseitige Präferenz besitzt.

## Abdeckung

`DataTable` wird in Übersichts-, Veranstaltungs-, Hardware- und Auszahlungslisten sowie in Event- und Gesamtaufgabenlisten genutzt. Der Modulvertrag setzt Kopfzeilen-, Zeilen-, Zellen- und Fokusverhalten auch für bestehende Tabellenmarkierung zentral durch; Routen behalten nur ihre fachlichen Filter und Zellinhalte.

Die Eventtabellen in Übersicht und Veranstaltungen zeigen Sportart und Services als getrennte, sortierbare Spalten. Mehrere Services stehen zusammengefasst in einer Zelle; bei langen Werten ist der vollständige Text als Tooltip verfügbar. Siehe [Übersicht](../../src/routes/index.tsx), [Veranstaltungen](../../src/routes/veranstaltungen.tsx) und [Browser-Regression](../../tests/e2e/event-management.spec.ts).

## Dichte Arbeitsseiten (Variante A)

Die Nutzerentscheidung vom 2026-09-15 legt die A-Richtung für die Inhaltsseiten fest: Die bestehende linke Navigation bleibt, der Arbeitsbereich nutzt seine verfügbare Breite und zeigt Inhalte als dichte, unmittelbar sichtbare Listen. Kennzahlen sind eine schmale Zeile statt großflächiger Karten; Filter und Listenaktionen stehen in einer abgesetzten Kompaktzeile vor der Tabelle.

Die globale Aufgabenübersicht zeigt deshalb alle gefilterten Aufgaben direkt als Tabelle statt sie erst innerhalb aufklappbarer Event- und Kategorieblöcke zu verbergen. Die Task-Detailinteraktion bleibt unverändert im `TaskDetailSheet`; Gantt bleibt eine eigene Desktopansicht. Auf kleinen Bildschirmen bleiben die Listen als bedienbare Karten verfügbar.

Hardware, Auszahlungen, Veranstaltungen, Kontakte und Übersicht verwenden dieselbe vertikale Hierarchie. Einstellungen bleiben formularorientiert, füllen aber die Arbeitsbreite statt sie auf eine schmale Lesespalte zu begrenzen.

## Einzelzellenbearbeitung

Inline-Editing folgt dem ClickUp-artigen Zellmodell: Es ist immer nur die aktive Zelle im Bearbeitungsmodus; die übrigen Zellen derselben Zeile behalten ihre kompakte Anzeige und die Spaltenbreiten verändern sich nicht. `Tab` speichert die aktive Zelle und öffnet die nächste bearbeitbare Zelle derselben Zeile, `Shift+Tab` entsprechend die vorherige. `Escape` verwirft die aktuelle Zelländerung. Diese Nutzerentscheidung ersetzt für die Hardwaretabelle den bisherigen Ansatz, beim Klick alle Felder einer Zeile gleichzeitig als Eingaben darzustellen. Quelle: Nutzerkonversation vom 2026-09-15.

## Einheitliches Datumsformat

Sichtbare Datumswerte verwenden zentral `formatDatum` und erscheinen immer als `dd.mm.yyyy`. Zeitstempel ergänzen die Uhrzeit erst nach diesem vollständigen Datum. Das gilt auch für Zeiträume, Aufgaben, Hardware, Auszahlungen, Kommunikation, Auditlog und Änderungsverlauf; ISO-Werte bleiben ausschließlich das Daten- und Eingabeformat.

Siehe auch [Aufgabenplanung und Tabellen-Vertiefung](task-planning-and-table-deepening-2026-09-15.md).
