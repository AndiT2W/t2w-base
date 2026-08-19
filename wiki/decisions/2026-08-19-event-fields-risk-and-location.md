# Eventfelder: Risiko und Ort

## Entscheidung

- `Risiko` ist kein Eventfeld und wird nicht im Eventformular oder Eventmodell geführt.
- `Ort` bleibt ein Freitextfeld.
- `Ort` ist im „Neues Event“-Modal optional.
- `Sportart` wird im Anlageformular als Dropdown angeboten; neue Sportarten können direkt hinzugefügt werden.
- `Veranstalter` wird über ein Such-Dropdown aus den Stammdaten ausgewählt; neue Veranstalter können direkt angelegt werden.
- Der interne Hauptverantwortliche ist im Anlageformular optional.
- Die Teilnehmerzahl wird nicht im Anlageformular manuell erfasst. Wenn `t2w_event_id` gesetzt ist, wird sie einmal täglich aus TIME2WIN aktualisiert.
- Teilnehmerprognose und aktueller Teilnehmerstand werden als zwei getrennte Werte geführt.
- `t2w_event_id` wird ausschließlich auf der Eventdetailseite im eigenen Reiter `TIME2WIN-Verknüpfung` neben `Stammdaten` gepflegt.
- Die Sportart kann aus der TIME2WIN-Event-API stammen, wenn eine `t2w_event_id` verknüpft ist.
- Ohne `t2w_event_id` wird die Sportart im Event selbst über das erweiterbare Dropdown gepflegt.
- Wird eine `t2w_event_id` später ergänzt, darf die API-Sportart die manuelle Sportart nicht ungefragt überschreiben; Abweichungen müssen sichtbar sein und bestätigt werden.
- Der Reiter zeigt das verknüpfte TIME2WIN-Event, die verfügbaren Bewerbe und Teilnehmerstatistiken je Bewerb.
- Als Teilnehmerstatistik wird im MVP je Bewerb ausschließlich die Zahl der gemeldeten Teilnehmer angezeigt.
- Gemeldete Einzelteilnehmer und Teams werden im MVP nicht getrennt; angezeigt wird eine gemeinsame Zahl `Gemeldete TN`.
- Technologien bzw. technische Leistungen werden ausschließlich auf der Eventdetailseite gepflegt und sind optional.

## Konsequenzen

- Risikoindikatoren dürfen nicht als Bestandteil der Eventstammdaten oder Eventübersicht vorausgesetzt werden.
- Ein Event darf ohne Ort angelegt werden.
- Eine strukturierte Adressmodellierung ist für den aktuellen Event-MVP nicht erforderlich.
- Die Sportartenliste ist erweiterbar und darf nicht auf eine fest codierte Auswahl beschränkt sein.
- Veranstalter werden als Stammdaten referenziert und nicht als reiner Event-Freitext gespeichert.
- Eine fehlende TIME2WIN-ID verhindert weder die Eventanlage noch die manuelle Sportartenauswahl.
- Die tägliche Teilnehmer-Synchronisation benötigt weiterhin eine definierte Behandlung für API-Ausfälle; sie darf die Teilnehmerprognose nicht überschreiben.
- Die TIME2WIN-Verknüpfung ist im Anlage-Modal nicht erforderlich.
- Die Ansicht enthält außerdem Synchronisierungsstatus, letzte Synchronisierung, manuelle Synchronisierung und Fehlerstatus.
- Weitere Statuswerte wie bezahlt, eingecheckt, gestartet oder finisher sind für diesen Reiter im MVP nicht vorgesehen.
- Straße, PLZ, Land und separate Orts-/Location-Felder werden nicht automatisch aus dieser Entscheidung abgeleitet.

## Quelle

- User conversation, 2026-08-19.
