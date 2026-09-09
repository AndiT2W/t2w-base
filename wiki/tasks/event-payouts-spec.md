# Spezifikation: Nenngeld-Auszahlungen

## Status

- in implementation (Issues #41–#48)
- ClickUp-Liste `AUSZAHLUNGEN` geprüft am 2026-09-09

## Ziel

Monatliche Nenngeld-Auszahlungen pro Event im Event-Finanzreiter erfassen, per n8n per Mail versenden und in einer zentralen Übersicht über alle Events bearbeiten können. ClickUp ist Migrationsquelle, nicht Zielabhängigkeit.

## Bestehende ClickUp-Felder

Die Liste enthält aktuell 1.013 Datensätze und die Felder `Name`, `Veranstaltung`, `Status`, `Auszahlungsbetrag`, `Transaktionsbestätigung` und `Datum aktualisiert`. Sichtbare Statusgruppen sind `erstellt`, `gesendet` und `ausbezahlt`; in der Beschreibung ist zusätzlich der Versandstatus `versenden` dokumentiert.

## Empfohlenes Domänenmodell

`Event` hat viele `NenngeldAuszahlungen`. Die bestehende Eventrolle `Auszahlungsempfänger` bleibt der Default; jede Auszahlung speichert den tatsächlich verwendeten Empfänger. Historische, noch nicht zugeordnete Auszahlungen können außerhalb eines Events existieren.

### Auszahlung

- `id`: interne UUID/ID
- `payoutNumber`: globale Jahressequenz, Darstellung `T260001` (`T` = Transaktion, `26` = Jahr); niemals wiederverwenden
- `eventId`: optionale Referenz auf ein Event; historische Datensätze ohne eindeutige Zuordnung werden mit `null` importiert und als nachzuordnen markiert
- kein Abrechnungsmonat im MVP
- `recipientId`: wird aus dem Event-Auszahlungsempfänger übernommen
- `recipientSnapshot`: Name, Adresse, IBAN, BIC und E-Mail zum Zeitpunkt der Freigabe/Versendung
- `amount`: Decimal, >= 0
- `currency`: Währung je Auszahlung, mindestens `EUR` und `CHF`
- `mailStatus`: `ENTWURF`, `VERSENDEN`, `GESENDET`
- `paymentStatus`: `OFFEN`, `AUSBEZAHLT`, optional `STORNIERT`
- sichtbarer Gesamtstatus: kompakte Projektion aus beiden Statusfeldern
- `transactionReference`: Transaktionsbestätigung als Freitext; Belege/Dateilinks später
- `paidAt`: Auszahlungsdatum; `mailSentAt`
- `mailRecipient`: beim Versand verwendete Adresse aus dem Event-Auszahlungsempfänger
- `n8nCorrelationId`/`externalMessageId`: Idempotenz- und Nachvollziehbarkeitsreferenz
- `notes`, `createdAt`, `updatedAt`
- Änderungen an Betrag, Empfänger, Mailadresse und Status werden im zentralen, unveränderlichen Auditlog mit Vorher-/Nachherwert, Benutzer und Zeitpunkt protokolliert. Der Auditlog ist ein plattformweiter Baustein für alle relevanten Änderungen in `t2w-base`.
- Dauerhafte Löschung ist erlaubt; die Löschung selbst bleibt im Auditlog erhalten und die vergebene Nummer wird nicht wiederverwendet.

## Statusregeln

- `ENTWURF`: bearbeitbar, noch kein Versand
- `VERSENDEN`: explizite Versandfreigabe; n8n darf abholen
- `GESENDET`: Mail erfolgreich versendet, Zahlung noch offen
- `AUSBEZAHLT`: Zahlung durchgeführt; `paidAt` und möglichst `transactionReference` erforderlich
- `STORNIERT`: annulliert; keine weitere Mail-/Zahlungsaktion

Der Übergang `VERSENDEN -> GESENDET` darf nur nach bestätigtem n8n-Erfolg erfolgen. Wiederholte Abfragen dürfen keine zweite Mail versenden; dafür braucht es atomare Claim-/Idempotenzlogik. Fehler lassen den Status auf `VERSENDEN` und speichern die Fehlermeldung.

Die n8n-Anbindung soll als generisches Automationsmuster für weitere Bereiche wie Hardware und Rechnungen umgesetzt werden: statusbasierte Abholung, atomarer Claim, Ergebnis-/Status-Callback, externe Workflow-ID, Retry-Information und Idempotenz.

## Event-Finanzreiter

Tabelle „Auszahlungen“ mit laufender Nummer, Empfänger, Betrag, Gesamtstatus, Versanddatum und Auszahlungsdatum; Anlegen, Öffnen und Bearbeiten; Empfänger aus dem Event übernehmen; Snapshot spätestens bei `VERSENDEN`; Aktion „Für Mailversand markieren“. Änderungen bleiben auch nach Versand möglich und sind im Auditlog sichtbar.

## Zentrale Übersichtsseite

Neue Seite „Auszahlungen“ mit globaler Tabelle, Filtern nach Event/Jahr/Empfänger/Status, Suche nach Nummer/Eventcode/Empfänger, Summen der gefilterten Ergebnisse, direkter Bearbeitung, Eventnavigation, neuer Auszahlung mit Eventauswahl und Sammelaktionen (insbesondere mehrere Datensätze für Mailversand markieren). Sammelaktionen benötigen eine explizite Bestätigung und werden protokolliert. Standard: nicht stornierte, neueste zuerst.

## Migration aus ClickUp

Export/API-Snapshot unverändert unter `raw/` ablegen; Event und Empfänger über stabile IDs mappen; Monatsinformation nur bei eindeutiger Quelle übernehmen, sonst Reviewliste; Beträge als Decimal normalisieren; Belege und historische Daten übernehmen; unklare Zuordnungen nicht automatisch importieren; Vorschau-, Idempotenz- und Importbericht vor dem Produktivlauf.

## Vor der Umsetzung zu entscheiden

- `gesendet` bedeutet Mailversand, `ausbezahlt` tatsächliche Überweisung? Empfohlen: getrennte Zustände wie oben.
- Darf es mehrere Teil-/Korrekturauszahlungen je Event und Monat geben? Empfohlen: ja, mit optionaler Korrektur-/Storno-Referenz.
- Stammdatenadresse oder Eventkontakt als Mailziel? Empfohlen: explizite Adresse je Auszahlung speichern.
- Nummernformat: global je Kalenderjahr, Darstellung `T26XXXX`, nicht wiederverwendbar.
- Verbindliche n8n-Schnittstelle, Mailvorlage, Absender und Fehler-/Retry-Verhalten?

## Umsetzungsschritte

1. Entscheidungen bestätigen und vollständiges ClickUp-Feldmapping validieren.
2. Domain-/Prisma-Modell inklusive Sequenz, Statuscodes, Snapshot und Auditlog entwerfen.
3. Backend-CRUD und sichere n8n-Claim/Success/Failure-Schnittstelle bauen.
4. Event-Finanzreiter und zentrale Übersicht ergänzen.
5. ClickUp-Import als Vorschau und idempotenten Lauf implementieren.
6. n8n-Mailworkflow mit Doppelversand-Schutz anschließen.
7. Browser-E2E für Anlegen, Reload, Filter, Nummernvergabe und Versandstatusfluss ergänzen.
8. Mit Testdaten abnehmen, danach historische Daten migrieren.

## Evidence

- [ClickUp Live Structure Review](../sources/2026-06-29-clickup-live-structure-review.md)
- [User Finance Role Model](../sources/2026-06-29-user-finance-role-model.md)
- [Person, Kundenprofil und Eventrollen](../decisions/2026-08-21-person-kundenprofil-und-eventrollen.md)
- ClickUp-Liste `AUSZAHLUNGEN`, vom Nutzer am 2026-09-09 bereitgestellte URL
