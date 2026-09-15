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
  - ../../services/event-service/src/table-preferences.controller.ts
  - ../../services/event-service/prisma/schema.prisma
  - ../../docs/adr/0003-shared-compact-data-tables.md
  - User conversation, 2026-09-14
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

Siehe auch [Aufgabenplanung und Tabellen-Vertiefung](task-planning-and-table-deepening-2026-09-15.md).
