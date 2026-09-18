# Source: Rechnungen-Kundenstamm-Abgleich 2026

## Metadata

- Date: 2026-09-15
- Type: Rechnungsbestand und abgeleitete Importarbeitsmappe
- Location: [`raw/03_rechnungen/`](../../raw/03_rechnungen/) und [`t2w-kundenstamm-abgeglichen.xlsx`](../../outputs/customer-reconciliation-2026-09-15/t2w-kundenstamm-abgeglichen.xlsx)
- Status: active

## Summary

- Der bestehende Importstand mit 114 Kunden und 146 zugeordneten Rechnungsbelegen wurde gegen alle 164 PDF-Dateien des Rechnungsordners abgeglichen.
- Der neue Importstand enthält 123 Kunden. Alle 164 PDF-Belege sind genau einem Kunden zugeordnet.
- 18 zuvor nicht zugeordnete Belege wurden ergänzt. Vier Dublettenzeilen wurden in drei bestehende Kundenkonten integriert.

## Key Facts

- Die Rechnungen 260001, 260089 und 260159 gehören zur gemeinsamen Rechnungsanschrift `Tonstudio & EDV-Dienstleistungen`; Markus Lindinger ist als Primärkontakt erfasst.
- `Emo Tirol`, `JACARANDA Sport Consulting GmbH` und `Trailabenteuer` lagen mit mehreren Adress- oder Namensständen vor. Die Datensätze sind zusammengeführt; ältere Angaben bleiben in der Hinweisspalte erhalten.
- Die UID `ATU75191418` gehört TIME2WIN. Wo sie durch die frühere Extraktion einem Rechnungsempfänger zugeordnet war, wurde sie entfernt und der Konflikt markiert.
- Rechnung 260087 enthält keinen Kundennamen. `Markus Sob` wurde aus der `z.Hd.`-Zeile als Person übernommen und bleibt zur manuellen Prüfung markiert.
- Rechnung 260161 zeigt kein Land. Für `Herwig Höfle` wurde Österreich aus PLZ und Ort abgeleitet und markiert.
- Die Rechnung 260162 und die Stornorechnung 260162ST gehören zu demselben Kunden `Daniel Wimmer`.

## Implications For Project

- Rechnungsquellen müssen pro Kundenkonto nachvollziehbar bleiben; fehlende oder widersprüchliche Felder dürfen nicht stillschweigend als Stammdaten gelten.
- Eine stabile UID ist ein belastbarer Dublettenhinweis, Adressänderungen müssen dennoch als historische Rechnungsanschriften erhalten bleiben.
- Rechnungsempfänger können Organisationen oder einzelne Personen sein und sind nicht zwingend identisch mit dem operativen Veranstalter.

## Production Import

- Am 2026-09-15 wurde der abgeglichene Stand transaktional in die Hostinger-Produktionsdatenbank des `t2w-base`-Event-Service importiert.
- 109 vorhandene `Organizer` wurden aktualisiert und 14 neue angelegt. Eine schmale Aliaszuordnung korrigierte 14 frühere `U+FFFD`-Zeichenfehler in deutschen Kundennamen, statt zweite Datensätze anzulegen.
- Der Import setzte bzw. verknüpfte 20 neue Kontakte; danach bestehen 126 Organisationen, 117 Kontakte und 106 gesetzte Primärkontakte. Alle 123 Rechnungs-Kunden sind eindeutig aufgelöst; kein Kundename enthält mehr `U+FFFD`.
- Vor dem Import wurde ein vollständiger PostgreSQL-Dump auf Hostinger unter `/docker/t2w-base/backups/customer-import-2026-09-15/t2w_events-before-customer-import.dump` erzeugt. Das angewandte, idempotent angelegte SQL-Skript ist [`hostinger-kundenimport.sql`](../../outputs/customer-reconciliation-2026-09-15/hostinger-kundenimport.sql).

## Related Pages

- [Organizer Account Model](../concepts/organizer-account-model.md)
- [Invoice MVP Specification](../tasks/invoice-mvp-spec.md)
- [Ausgangsarbeitsmappe](../../outputs/invoice-import/t2w-kunden-import-korrigiert.xlsx)
