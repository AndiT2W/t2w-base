# Verbindliche Eventstatuswerte

## Entscheidung

Für Events gelten im fachlichen Modell diese Statuswerte:

- `Anfrage`
- `Angebot gesendet`
- `Zugesagt`
- `Abgesagt`
- `Akquise`
- `Datum prüfen`

Die Statuswerte aus der bisherigen UI (`Entwurf`, `Angefragt`, `Abgeschlossen`, `Storniert`) sind damit fachlich überholt.

## Konsequenzen

- Das „Neues Event“-Modal verwendet diese Statusliste.
- Neu angelegte Events erhalten standardmäßig den Status `Anfrage`.
- Statuslabels, Filter, Badges und Kalenderlegende müssen dieselbe Liste verwenden.
- `Entwurf` wird nicht als zusätzlicher Geschäftsstatus eingeführt.

## Quelle

- User conversation, 2026-08-19.
- [Target Model V1](../sources/2026-06-30-user-target-model-v1.md)
