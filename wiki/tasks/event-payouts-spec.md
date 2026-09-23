# Spezifikation: Nenngeld-Auszahlungen

## Status

- in implementation (Issues #41–#48)
- ClickUp-Liste `AUSZAHLUNGEN` geprüft am 2026-09-09

## Ziel

Monatliche Nenngeld-Auszahlungen pro Event im Event-Finanzreiter erfassen, per n8n per Mail versenden und in einer zentralen Übersicht über alle Events bearbeiten können. ClickUp ist Migrationsquelle, nicht Zielabhängigkeit.

## Bestehende ClickUp-Felder

Der aktuelle Quellstand vom 2026-09-23 enthält 1.034 Datensätze. Der 2026-Ausschnitt umfasst 320 `T26xxxx`-Tasks: 305 `ausbezahlt`, 14 `erstellt` und 1 `gesendet`. Die Felder umfassen `Name`, `Veranstaltung`, `Status`, `Auszahlungsbetrag`, `Transaktionsbestätigung`, `Überweisungsdatum`, `Kommentar` und `Datum aktualisiert`; in der Beschreibung ist zusätzlich der Versandstatus `versenden` dokumentiert. Siehe [ClickUp-Auszahlungen 2026](../sources/2026-09-23-clickup-auszahlungen-2026.md).

## Empfohlenes Domänenmodell

`Event` hat viele `NenngeldAuszahlungen`. Die bestehende Eventrolle `Auszahlungsempfänger` bleibt der Default; jede Auszahlung speichert den tatsächlich verwendeten Empfänger. Historische, noch nicht zugeordnete Auszahlungen können außerhalb eines Events existieren.

### Auszahlung

- `id`: interne UUID/ID
- `payoutNumber`: globale Jahressequenz, Darstellung `T260001` (`T` = Transaktion, `26` = Jahr); niemals wiederverwenden
- `eventId`: optionale Referenz auf ein Event; historische Datensätze ohne eindeutige Zuordnung werden mit `null` importiert und als nachzuordnen markiert
- ClickUp-Auszahlungen mit mehreren Eventbeziehungen lassen sich in diesem Einzelfeld nicht vollständig darstellen; der Import behält die Primärzuordnung und hält weitere Quell-IDs zur Prüfung/Nachsync im Arbeitsblatt fest, bis das Zielmodell dafür entschieden ist.
- kein Abrechnungsmonat im MVP
- `recipientId`: wird aus dem Event-Auszahlungsempfänger übernommen
- `recipientSnapshot`: Name, Adresse, IBAN, BIC und E-Mail zum Zeitpunkt der Freigabe/Versendung
- `amount`: Decimal, >= 0
- `currency`: Währung je Auszahlung, mindestens `EUR` und `CHF`
- `status`: `ENTWURF`, `VERSANDBEREIT`, `VERSAND_LAEUFT`, `MAIL_GESENDET`, `AUSBEZAHLT`, `STORNIERT`
- `transactionReference`: Transaktionsbestätigung als Freitext; Belege/Dateilinks später
- `paidAt`: Auszahlungsdatum; `mailSentAt`
- `notes`, `createdAt`, `updatedAt`
- Die tatsächlich verwendete Empfängeradresse liegt in `recipientSnapshot.email`; ein separates `mailRecipient`-Feld entfällt.
- Technische Claim- und Versanddaten liegen zentral in `AutomationClaim`, nicht an `Payout`: Idempotenzschlüssel, Workflow, Claim-/Abschlusszeit, Ergebnis, Fehler, Wiederholungszahl und externe Nachrichten-ID. Ein separates `n8nCorrelationId` entfällt.
- Änderungen an Betrag, Empfänger, Mailadresse und Status werden im zentralen, unveränderlichen Auditlog mit Vorher-/Nachherwert, Benutzer und Zeitpunkt protokolliert. Der Auditlog ist ein plattformweiter Baustein für alle relevanten Änderungen in `t2w-base`.
- Dauerhafte Löschung ist erlaubt; die Löschung selbst bleibt im Auditlog erhalten und die vergebene Nummer wird nicht wiederverwendet.

## Statusregeln

- `ENTWURF`: bearbeitbar, noch keine Versandfreigabe
- `VERSANDBEREIT`: explizite Versandfreigabe; n8n darf abholen
- `VERSAND_LAEUFT`: temporärer, atomar vergebener Claim; kein zweiter Versand darf starten
- `MAIL_GESENDET`: Mail erfolgreich versendet, Zahlung noch offen
- `AUSBEZAHLT`: Zahlung durchgeführt; `paidAt` und möglichst `transactionReference` erforderlich
- `STORNIERT`: annulliert; keine weitere Mail-/Zahlungsaktion

`MAIL_GESENDET` und `AUSBEZAHLT` bleiben getrennte fachliche Prüfpunkte innerhalb desselben Statusfelds. Der Versandübergang `VERSANDBEREIT -> VERSAND_LAEUFT -> MAIL_GESENDET` erfolgt über den bestätigten n8n-Ergebnisweg. Ein Versandfehler setzt den Status zurück auf `VERSANDBEREIT`; Fehler und Wiederholung werden am `AutomationClaim` gespeichert. Wiederholte Abfragen dürfen keine zweite Mail versenden.

Die n8n-Anbindung soll als generisches Automationsmuster für weitere Bereiche wie Hardware und Rechnungen umgesetzt werden: statusbasierte Abholung, atomarer Claim, Ergebnis-/Status-Callback, externe Workflow-ID, Retry-Information und Idempotenz.

## Event-Finanzreiter

Tabelle „Auszahlungen“ mit laufender Nummer, Empfänger, Betrag, einem Status, Versanddatum und Auszahlungsdatum; Anlegen, Öffnen und Bearbeiten; Empfänger aus dem Event übernehmen; Snapshot spätestens bei `VERSANDBEREIT`; Aktion „Für Mailversand markieren“. Änderungen bleiben auch nach Versand möglich und sind im Auditlog sichtbar.

## Zentrale Übersichtsseite

Neue Seite „Auszahlungen“ mit globaler Tabelle, Filtern nach Event/Jahr/Empfänger/Status, Suche nach Nummer/Eventcode/Empfänger, Summen der gefilterten Ergebnisse, direkter Bearbeitung, Eventnavigation, neuer Auszahlung mit Eventauswahl und Sammelaktionen (insbesondere mehrere Datensätze für Mailversand markieren). Sammelaktionen benötigen eine explizite Bestätigung und werden protokolliert. Standard: nicht stornierte, neueste zuerst.

## Migration aus ClickUp

Export/API-Snapshot unverändert unter `raw/` ablegen; Event und Empfänger über stabile IDs mappen; Monatsinformation nur bei eindeutiger Quelle übernehmen, sonst Reviewliste; Beträge als Decimal normalisieren; Belege und historische Daten übernehmen; unklare Zuordnungen nicht automatisch importieren; Vorschau-, Idempotenz- und Importbericht vor dem Produktivlauf.

## Vor der Umsetzung zu entscheiden

- Darf es mehrere Teil-/Korrekturauszahlungen je Event und Monat geben? Empfohlen: ja, mit optionaler Korrektur-/Storno-Referenz.
- Die Empfängeradresse wird beim Versandfreigeben aus dem Event-Auszahlungsempfänger übernommen und als konkreter Wert in `recipientSnapshot.email` gespeichert; spätere Stammdatenänderungen verändern den Snapshot nicht automatisch.
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
