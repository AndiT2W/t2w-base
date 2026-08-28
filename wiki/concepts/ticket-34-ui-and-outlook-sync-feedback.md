# Ticket #34: UI und Outlook-Sync-Rückmeldung

Stand: 2026-08-28

## Umgesetztes Verhalten

- Bestehende Eventkontakte wählen ihre Rolle aus den aktiven zentralen Eventrollen. Ein historischer, nicht mehr konfigurierter Wert bleibt als aktuelle Auswahl erhalten, bis er bewusst geändert wird.
- Die Outlook-Ordnerplanung prüft den konfigurierten Jahres-, Quartals- und Eventpfad und meldet `EXISTS`, `MISSING` oder `UNKNOWN` an die UI.
- Vor dem Sync zeigt die Eventdetailseite, ob der Outlook-Ordner bereits vorhanden ist oder neu erstellt wird. Nach erfolgreichem Sync wird die Planung neu geladen.
- Übersicht und Veranstaltungsliste besitzen mobile, priorisierte Eventkarten. Interaktive Elemente haben mobile Touch-Ziele von mindestens 44 px.
- Kontakt-Overlays verwenden zugängliche Dialog-/Sheet-Primitiven mit Escape-Schließen, Fokusbegrenzung und Fokus-Rückgabe. Tabellen verwenden explizite Detaillinks statt klickbarer Zeilen mit verschachtelten Aktionen.
- Die Sprachauswahl ist als Button-Gruppe umgesetzt und funktioniert auch während der initialen Hydrierung.

## Regressionen

Browser-E2E deckt Rollenänderung samt Reload, Outlook-Status vor und nach Sync, mobile Darstellung und Touch-Ziele, Tabellen-Navigation sowie Dialogfokus ab. Der Event-Service prüft die Outlook-Pfadexistenz zusätzlich mit Unit-Tests.

## Evidenz

- [GitHub Issue #34](https://github.com/AndiT2W/t2w-base/issues/34)
- [`src/routes/events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx)
- [`services/event-service/src/outlook/outlook.folder.service.ts`](../../services/event-service/src/outlook/outlook.folder.service.ts)
- [`tests/e2e/event-management.spec.ts`](../../tests/e2e/event-management.spec.ts)
