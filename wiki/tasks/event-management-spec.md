# Spec: Zentrale Eventverwaltung und TIME2WIN-Verknüpfung

## Problem Statement

Eventübersicht, Anlage-Modal, Kalender und Detailseite benötigen eine gemeinsame Datenquelle. Der aktuelle Prototyp verwendet Demo-/LocalStorage-Daten, enthält eine überholte Statusliste und führt Risiko als Eventfeld. TIME2WIN-Daten müssen kontrolliert ergänzt werden, auch wenn ein Event zunächst keine `t2w_event_id` besitzt.

## Solution

Eine zentrale Event-Daten- und Logikschicht stellt das Eventmodell und gemeinsame Regeln für Übersicht, Modal, Kalender, Detailseite und externe Dienste bereit. Die Detailseite erhält einen eigenen Reiter `TIME2WIN-Verknüpfung` neben `Stammdaten`.

Events können ohne TIME2WIN-ID vollständig angelegt werden. Sportart und lokale Eventdaten bleiben dann manuell pflegbar. Nach einer späteren Verknüpfung werden TIME2WIN-Daten angezeigt und synchronisiert; manuelle Werte werden nicht ungefragt überschrieben.

## User Stories

1. Als interne Benutzerin möchte ich Events zentral suchen, filtern und öffnen.
2. Als interne Benutzerin möchte ich aus Übersicht und Kalender ein neues Event als Modal anlegen.
3. Als interne Benutzerin möchte ich nach dem Speichern direkt auf die Detailseite gelangen.
4. Als interne Benutzerin möchte ich Eventname, Eventstatus, Veranstalter, Start-/Endzeitpunkt, Sportart und Eventcode erfassen.
5. Als interne Benutzerin möchte ich, dass neue Events mit `Anfrage` starten.
6. Als interne Benutzerin möchte ich den Eventcode automatisch vorgeschlagen bekommen, ihn vor dem Speichern ändern können und danach stabil behalten.
7. Als interne Benutzerin möchte ich Veranstalter suchen oder direkt neu anlegen können.
8. Als interne Benutzerin möchte ich Sportarten aus einem Dropdown wählen oder direkt ergänzen können.
9. Als interne Benutzerin möchte ich Ort optional als Freitext erfassen.
10. Als interne Benutzerin möchte ich den Hauptverantwortlichen optional zuordnen.
11. Als interne Benutzerin möchte ich Teilnehmerprognose und aktuellen Teilnehmerstand getrennt sehen.
12. Als interne Benutzerin möchte ich `t2w_event_id` im Reiter `TIME2WIN-Verknüpfung` pflegen.
13. Als interne Benutzerin möchte ich das verknüpfte TIME2WIN-Event und seine Bewerbe sehen.
14. Als interne Benutzerin möchte ich je Bewerb die gemeinsame Zahl `Gemeldete TN` sehen.
15. Als interne Benutzerin möchte ich letzte Synchronisierung, Status und Fehler sehen sowie manuell synchronisieren können.
16. Als interne Benutzerin möchte ich Technologien und technische Leistungen erst auf der Detailseite pflegen.
17. Als interne Benutzerin möchte ich Monats-/Wochenkalender und mehrtägige Events verwenden.
18. Als interne Benutzerin möchte ich Veranstalter- und Kontakt-Stammdaten wiederverwenden und Eventrollen zuordnen.

## Implementation Decisions

- Zentrale Seam: gemeinsame Event-Daten- und Logikschicht; alle Ansichten und Dienste verwenden sie.
- Eventfelder: interne ID, Eventcode, Name, Status, Veranstalter-Referenz, Sportart-Referenz, Start, Ende, optionaler Ort-Freitext, optionaler Hauptverantwortlicher, Teilnehmerprognose, Notizen, Archivstatus.
- Verbindliche Statuswerte: `Anfrage`, `Angebot gesendet`, `Zugesagt`, `Abgesagt`, `Akquise`, `Datum prüfen`.
- `Risiko` ist kein Eventfeld.
- Ort ist optionaler Freitext; keine strukturierte Eventadresse im aktuellen MVP.
- Veranstalter ist eine eigene Stammdaten-Entität für Organisation oder Einzelperson; Rechnungsempfänger und Auszahlungsempfänger können abweichen.
- Sportarten sind erweiterbare Stammdaten. Ohne `t2w_event_id` wird die lokale Sportart manuell gepflegt.
- Technologien/technische Leistungen sind optionale Detailseitendaten.
- `t2w_event_id` wird nur im Reiter `TIME2WIN-Verknüpfung` neben `Stammdaten` gepflegt.
- Teilnehmerprognose und aktueller Teilnehmerstand sind getrennt.
- Bei gesetzter `t2w_event_id` wird die Teilnehmerzahl einmal täglich aus TIME2WIN synchronisiert; manuelle Synchronisierung ist möglich.
- Der TIME2WIN-Reiter zeigt Event, Bewerbe, je Bewerb eine gemeinsame Zahl `Gemeldete TN`, letzte Synchronisierung, Status und Fehler.
- Einzelteilnehmer und Teams werden im MVP nicht getrennt. Andere Statistiken wie bezahlt, eingecheckt, gestartet oder finisher sind out of scope.
- TIME2WIN-Sportart wird angezeigt. Bei Abweichung zur lokalen Sportart gibt es einen Hinweis mit bewusster Übernahmeentscheidung; kein ungefragtes Überschreiben.
- Bei API-Ausfall bleibt der letzte erfolgreiche Wert erhalten und der Fehlerstatus wird angezeigt.
- Die Eventansicht unterstützt Suche/Filter; der Kalender Monats-/Wochenansicht, mehrtägige Balken und Navigation zur Detailseite.

## Testing Decisions

- Tests prüfen äußeres Verhalten, nicht interne Komponentenstruktur.
- Zentrale Daten-/Logikschicht: Anlage, Updates, Status, stabile Eventcodes, Archivierung und getrennte Teilnehmerwerte.
- Anlageflow: Pflichtfelder, Defaultstatus, Veranstalter-/Sportart-Auswahl, optionale Felder, Abbruch und Weiterleitung.
- Ansichten: gemeinsame Daten, Suche/Filter, Monats-/Wochenwechsel, mehrtägige Events und Detailnavigation.
- TIME2WIN: tägliche/manuelle Synchronisierung, Bewerbsteilnehmer, Fehlerstatus, letzter erfolgreicher Wert und Nichtüberschreiben lokaler Werte.
- Stammdaten: Wiederverwendung und Zuordnung von Veranstaltern/Kontakten.

## Out of Scope

- Risikoindikator als Eventfeld
- strukturierte Eventadresse
- getrennte Einzelteilnehmer-/Teamstatistik
- weitere Teilnehmerstatuswerte
- native Angebots-/Rechnungserstellung
- automatische Outlook-/WhatsApp-Aggregation
- komplexe Projektplanung
- ClickUp als dauerhafte Abhängigkeit
- automatische Überschreibung manueller Sportarten

## Further Notes

- Die aktuelle UI-Statusliste und das Risiko-Feld müssen an diese fachliche Definition angepasst werden.
- Die zentrale Datenquelle muss die derzeitige Demo-/LocalStorage-Verwendung ablösen.
- TIME2WIN-Aufrufe verwenden die vorhandene TIME2WIN-Integration.
- Synchronisationszeit und Retry-Strategie sind technische Folgeentscheidungen.

