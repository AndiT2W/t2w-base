# TIME2WIN-Event-ID in den Stammdaten bearbeiten

## Entscheidung

Die TIME2WIN-Event-ID ist direkt im Stammdatenbereich eines Events als ganzzahlige ID änderbar. Änderungen werden mit den übrigen Event-Stammdaten gespeichert. Der sichtbare Event-Reiter `ANMELDUNG` zeigt weiterhin die verknüpften TIME2WIN-Eventdaten und Synchronisierung.

## Grund

Die bisher schreibgeschützte ID ließ sich in der Eventverwaltung nicht korrigieren oder neu verknüpfen.

## Konsequenzen

- Das Stammdatenfeld aktualisiert den Event-Entwurf und verwendet den bestehenden Event-Speicherpfad.
- Ein Browser-E2E-Test prüft Änderung, PATCH-Wert und Erhalt nach vollständigem Reload.
- Die frühere Pflegeort-Festlegung in [Eventfelder: Risiko und Ort](2026-08-19-event-fields-risk-and-location.md) ist für die Event-ID durch diese Entscheidung ersetzt.

## Quelle

- Nutzerkonversation vom 2026-09-15.
- Implementierung und Regression: [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx), [`event-management.spec.ts`](../../tests/e2e/event-management.spec.ts).
