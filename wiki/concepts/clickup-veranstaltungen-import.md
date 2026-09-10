# ClickUp-Import Veranstaltungen

## Status

Importdefinition, Stand 2026-09-09. Die Live-Liste konnte in dieser Sitzung nicht geprüft werden, weil ClickUp auf die Anmeldung umgeleitet hat. Grundlage ist der vorhandene ClickUp-Export unter `outputs/clickup-import/t2w-events-import.csv` sowie die bisher dokumentierte Datenstruktur.

## Ziel

Veranstaltungen aus der ClickUp-Liste `TIME2WIN > Office > VERANSTALTUNGEN` werden als Events importiert. ClickUp bleibt dabei nur Quelle; die ClickUp-Task-ID wird als unveränderliche externe Referenz gespeichert.

## Importumfang

- Hauptaufgaben der Liste importieren; Unteraufgaben und reine Automations-/Buttonfelder nicht als eigene Events importieren.
- `task_id` als `externalSource=clickup` und `externalId` übernehmen.
- Name, Beschreibung/Notizen, Start-/Endtermin, Status, Ort, Verantwortlicher, Event-ID, Sportart, Typ und Teilnehmer übernehmen.
- Backend-, Outlook- und OneDrive-Links als externe Referenzen bzw. Pfade übernehmen; keine Dateien oder Nachrichten automatisch kopieren.
- Operative Felder wie Fahrzeug, UHF/TON/GPS und Mitarbeiterzuordnungen nur übernehmen, wenn das Zielmodell dafür ein explizites Feld besitzt; sonst in einem Importprotokoll erhalten.

## Stammdaten und Verknüpfungen

1. Kunden zuerst deduplizieren und anlegen/aktualisieren.
2. Danach Personen/Kontakte anlegen oder matchen.
3. Anschließend Events importieren und Rollen verknüpfen: Kunde, Veranstalter, Organisator, Rechnungsempfänger, Auszahlungsempfänger.
4. Matching-Reihenfolge: stabile vorhandene ID, danach normalisierte E-Mail, danach UID, danach IBAN, danach Name plus Adresse. Unsichere Treffer nie automatisch zusammenführen; als Prüfkonflikt ausgeben.

## IBAN/BIC-Regel

IBAN, BIC, Bankname und Auszahlungsadresse werden ausschließlich am Kunden-/Organisation-Datensatz gespeichert. Eine IBAN erzeugt keinen Kontakt. Ein Kontakt wird nur angelegt, wenn aus ClickUp tatsächlich eine Person oder eine Kontakt-E-Mail mit verwertbarem Namen hervorgeht; dieser Kontakt wird dann mit dem passenden Kunden verknüpft.

Wenn der Auszahlungsempfänger nur als Freitext vorliegt, wird zuerst ein Kundenkandidat erzeugt bzw. zur manuellen Prüfung vorgemerkt. IBAN/BIC werden nicht in Kontaktfeldern und nicht ungeschützt in Eventnotizen dupliziert. IBAN wird normalisiert (Leerzeichen entfernen, Großschreibung), validiert und bei Konflikten nicht überschrieben. Bei mehreren unterschiedlichen IBANs pro Kunde bleibt der Import auf manuelle Prüfung stehen.

## Rechnungsempfänger und Auszahlungsempfänger

Der Rechnungsempfänger wird bevorzugt aus der ClickUp-Beziehung übernommen. Ist er leer, darf der Auszahlungsempfänger als Rechnungsempfänger verwendet werden; diese automatische Ableitung muss im Importprotokoll sichtbar markiert werden. Auszahlungsempfänger bleibt trotzdem als eigene Eventrolle erhalten.

## Fehlende oder unklare Daten

Leere Felder bleiben leer/null. ClickUp-Status werden über eine Mappingtabelle auf die TIME2WIN-Eventstatus abgebildet. Nicht eindeutig zuordenbare Kunden, Kontakte und Rollen landen in einer Fehler-/Reviewliste mit Task-ID, Rohwert und vorgeschlagenem Treffer. Der Import ist zunächst als Vorschau mit Anzahl Neu/Update/Konflikt/Übersprungen auszuführen; erst danach erfolgt der produktive Lauf.

## Abnahme

Vor dem produktiven Import erforderlich: aktueller ClickUp-CSV-Export inklusive Custom Fields, Mapping-Review, Stichprobe über mindestens zehn Events, Prüfung der IBAN-Konflikte und ein Wiederholungslauf ohne zusätzliche Datensätze (Idempotenz). Der produktive Import darf keine ClickUp-Daten löschen oder verändern.

## Quellen

- [ClickUp-Import-CSV](../../outputs/clickup-import/t2w-events-import.csv)
- [Event-Datenmodell](../../src/lib/t2w/types.ts)
- [CRM-Datenmodell](../../src/lib/crm/types.ts)
- [Importentscheidungen im Log](../log.md)
