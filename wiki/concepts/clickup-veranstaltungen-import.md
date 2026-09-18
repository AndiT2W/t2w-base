# ClickUp-Import Veranstaltungen

## Status

Live-Import, Stand 2026-09-15. Die Liste wurde direkt in ClickUp geprüft und als Quellstand gesichert; siehe [Quellnachweis](../sources/2026-09-15-clickup-live-veranstaltungen.md).

## Ziel

Veranstaltungen aus der ClickUp-Liste `TIME2WIN > Office > VERANSTALTUNGEN` werden als Events importiert. `Event.clickUpId` ist die eindeutige, unveränderliche Sync-Referenz. `EventClickUpSource` hält den Quellstand getrennt als JSON, damit unbekannte Custom Fields und spätere Feldzuordnungen nicht verloren gehen.

## Eventcode und technische Referenz

Die ClickUp-Quelle enthält keinen eigenen Eventcode/Slug (`custom_id` ist in allen erfassten Aufgaben leer). Der Eventcode wird deshalb wie bei nativ angelegten Events aus Startdatum und Eventname gebildet: `YYMMDD_slug`; Kollisionen erhalten `_02`, `_03` usw. Die ClickUp-ID steht ausschließlich in `Event.clickUpId` und wird nicht auf der Stammdaten-Seite dargestellt. Ein Wiederholungslauf ersetzt nur die früheren Platzhalter-Codes `clickup-<id>`; nachträglich gepflegte Eventcodes bleiben unverändert.

## Katalogabruf und Standardansicht (2026-09-17)

Die Event-UI ruft `/api/v1/events` seitenweise mit `limit=500` ab, bis keine weitere volle Seite mehr geliefert wird. Der Event-Service verwendet ebenfalls 500 als Standardlimit (maximal 1.000), damit direkte Verbraucher nicht weiter beim früheren Standardlimit von 200 stehen bleiben. So werden sämtliche importierten Jahre geladen; bei 756 importierten ClickUp-Events sind dies derzeit zwei API-Seiten.

Die Veranstaltungs- und Gantt-Ansicht startet bewusst mit dem aktuellen Kalenderjahr. Der Zeitraum ist sichtbar als `Aktuelles Jahr` ausgewählt; die Veranstaltungsseite bietet zusätzlich `Nächstes Jahr` als Kalenderjahresfilter. Vergangene und weitere künftige Zeiträume bleiben über die bestehenden Zeitraumauswahlen erreichbar.

## Importumfang

- Hauptaufgaben der Liste importieren; Unteraufgaben und reine Automations-/Buttonfelder nicht als eigene Events importieren.
- Jede Quelle über `clickUpId` upserten; erneute Läufe dürfen keine Duplikate erzeugen.
- Name, Beschreibung/Notizen, Start-/Endtermin, Status, Ort, Verantwortlicher, Event-ID, Sportart, Typ und Teilnehmer in die passenden Eventfelder übernehmen, sofern die Quelle den Wert maschinenlesbar liefert. Jeder originale Rohwert bleibt zusätzlich im Source-Snapshot erhalten.
- Das ClickUp-Feld `Event Id` wird als technische TIME2WIN-Event-ID übernommen, wenn es eine positive ganze Zahl enthält. Der ClickUp-Platzhalter `0` bleibt im Ziel leer.
- Für den Eventstatus hat das fachliche Custom Field `Eventstatus` Vorrang vor dem ClickUp-Aufgabenworkflow. Textwerte wie `ZUSAGE` und die im Quellstand verifizierten Dropdownwerte werden auf den TIME2WIN-Status abgebildet; nur ohne dieses Feld bleibt der Workflowstatus ein Fallback.
- Backend-, Outlook- und OneDrive-Links als externe Referenzen bzw. Pfade übernehmen; keine Dateien oder Nachrichten automatisch kopieren.
- Operative Felder wie Fahrzeug, UHF/TON/GPS und Mitarbeiterzuordnungen nur übernehmen, wenn das Zielmodell dafür ein explizites Feld besitzt; sonst in einem Importprotokoll erhalten.

## Stammdaten und Verknüpfungen

Der Import verwendet ausschließlich die ClickUp-Listenbeziehung `Veranstalter` für die operative Event-Veranstalterrolle. Er gleicht ihren Namen mit aktiven vorhandenen Veranstalter-Stammdaten ab, nach Groß-/Kleinschreibung, Umlauten und Satzzeichen normalisiert. Nur ein einzelner Quellwert mit genau einem Treffer wird gesetzt. Eine bestehende Event-Zuordnung wird niemals durch den Import überschrieben.

`Sportart` wird aus dem ClickUp-Dropdown auf den Sport-Stammdatensatz aufgelöst. Die im Quellstand verifizierten Werte werden als Sportarten angelegt, falls sie im Ziel noch nicht existieren. `Typ` bezeichnet den Event-Service und wird auf die vorhandenen Service-Stammdaten abgebildet: Active, App, UHF, Anmeldung (only), GPS, Virtuell und Jörg. Ein Import ergänzt die zugehörige Event-Service-Zeile idempotent und entfernt keine bestehende Servicezuordnung. Nicht auflösbare Dropdownwerte werden mit ClickUp-ID, Eventcode und Rohwert im Importbericht gesammelt, statt eine Sportart oder einen Service zu raten.

Mehrere Quellveranstalter, fehlende Stammdatentreffer und doppelte Kandidaten werden nicht geraten oder neu angelegt, sondern als Review-Fälle mit ClickUp-ID, Eventcode und Quellwert ausgegeben. Die Felder `Kunde` und `Organisator` bleiben bewusst unberührt, weil sie fachlich von der operativen Veranstalterrolle abweichen können. Kontakte und weitere Rollen werden ebenfalls nicht heuristisch zusammengeführt; die Rohwerte bleiben im Quell-Snapshot für einen späteren, fachlich geprüften CRM-Import erhalten.

## IBAN/BIC-Regel

IBAN, BIC, Bankname und Auszahlungsadresse werden ausschließlich am Kunden-/Organisation-Datensatz gespeichert. Eine IBAN erzeugt keinen Kontakt. Ein Kontakt wird nur angelegt, wenn aus ClickUp tatsächlich eine Person oder eine Kontakt-E-Mail mit verwertbarem Namen hervorgeht; dieser Kontakt wird dann mit dem passenden Kunden verknüpft.

Wenn der Auszahlungsempfänger nur als Freitext vorliegt, wird zuerst ein Kundenkandidat erzeugt bzw. zur manuellen Prüfung vorgemerkt. IBAN/BIC werden nicht in Kontaktfeldern und nicht ungeschützt in Eventnotizen dupliziert. IBAN wird normalisiert (Leerzeichen entfernen, Großschreibung), validiert und bei Konflikten nicht überschrieben. Bei mehreren unterschiedlichen IBANs pro Kunde bleibt der Import auf manuelle Prüfung stehen.

## Rechnungsempfänger und Auszahlungsempfänger

Der Rechnungsempfänger wird bevorzugt aus der ClickUp-Beziehung übernommen. Ist er leer, darf der Auszahlungsempfänger als Rechnungsempfänger verwendet werden; diese automatische Ableitung muss im Importprotokoll sichtbar markiert werden. Auszahlungsempfänger bleibt trotzdem als eigene Eventrolle erhalten.

## Fehlende oder unklare Daten

Leere Felder bleiben leer/null. ClickUp-Status werden über eine Mappingtabelle auf die TIME2WIN-Eventstatus abgebildet. Nicht eindeutig zuordenbare Kunden, Kontakte und Rollen landen in einer Fehler-/Reviewliste mit Task-ID, Rohwert und vorgeschlagenem Treffer. Der Import ist zunächst als Vorschau mit Anzahl Neu/Update/Konflikt/Übersprungen auszuführen; erst danach erfolgt der produktive Lauf.

Der Live-Quellstand vom 2026-09-15 enthält wegen einer ausgeschöpften ClickUp-Connector-Quote Detaildaten für 494 der 756 Listeneinträge. Bei nachträglichen Statuskorrekturen ist deshalb ein vollständigerer Quellstand vorzuziehen, wenn ein Listeneintrag kein `Eventstatus` enthält. Der geprüfte Export in `outputs/clickup-import/t2w-events-import.csv` enthält beispielsweise für ClickUp-ID `86c6a8t7d` den Wert `ZUSAGE`, obwohl der Workflowstatus `OFFEN` lautet.

## Abnahme

Vor dem produktiven Import erforderlich: Prüfung des aktuellen Quellstands, Stichprobe über Events verschiedener Jahre und ein Wiederholungslauf ohne zusätzliche Datensätze (Idempotenz). Der produktive Import darf keine ClickUp-Daten löschen oder verändern.

## Quellen

- [ClickUp-Live-Quellstand vom 2026-09-15](../sources/2026-09-15-clickup-live-veranstaltungen.md)
- [Prisma-Eventdatenmodell](../../services/event-service/prisma/schema.prisma)
- [Importmodul](../../services/event-service/src/clickup-event-import.ts)
- Nutzerentscheidung vom 2026-09-15 (ClickUp-ID getrennt vom sichtbaren Eventcode)
