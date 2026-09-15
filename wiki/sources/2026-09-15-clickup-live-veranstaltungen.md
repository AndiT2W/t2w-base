---
title: ClickUp Live-Veranstaltungen
type: source
status: captured
updated: 2026-09-15
---

# ClickUp Live-Veranstaltungen

## Herkunft

- ClickUp: `TIME2WIN > Office > VERANSTALTUNGEN` (List-ID `901502626147`)
- Erfasst am 2026-09-15 mit geschlossenen Aufgaben.
- Umfang: 756 Hauptaufgaben. Unteraufgaben sind nicht Teil des Eventimports.

## Gesicherte Evidenz

- Vollständige Listenantwort: [`raw/clickup/2026-09-15-veranstaltungen-live-list.json`](../../raw/clickup/2026-09-15-veranstaltungen-live-list.json)
- Detailantworten mit Beschreibungen, Custom Fields, Anhängen, Abhängigkeiten, Verknüpfungen und Unteraufgaben für 500 Aufgaben: [`raw/clickup/`](../../raw/clickup/)

Die ClickUp-Connector-Quote endete nach diesen 500 Detailabrufen. Der Listenstand für alle 756 Aufgaben und die verfügbaren Detailantworten werden gemeinsam als `EventClickUpSource.sourceData` importiert. 494 der Detailantworten gehörten weiterhin zu einer Aufgabe in der aktuellen Liste; sechs waren zwischen Abruf und Listenstand nicht mehr enthalten. Der Live-Browser bestätigt, dass die Liste für offene und abgeschlossene Einträge die operativen Spalten zeigt; nicht automatisch hergeleitete Werte bleiben als Rohdaten erhalten.

Die erfassten Hauptaufgaben und Detailantworten enthalten keinen gesetzten `custom_id` und kein Feld für einen eigenen Eventcode/Slug. Der Eventcode wird daher nach der bestehenden TIME2WIN-Regel aus Termin und Eventname abgeleitet; die ClickUp-Aufgaben-ID bleibt die Sync-Referenz.

## Verwendung

Die Quelle wird über [`wiki/concepts/clickup-veranstaltungen-import.md`](../concepts/clickup-veranstaltungen-import.md) in das Eventmodell überführt. `Event.clickUpId` dient als eindeutiger Schlüssel für spätere ClickUp-Synchronisationen.
