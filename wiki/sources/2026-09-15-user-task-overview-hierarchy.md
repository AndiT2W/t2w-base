# Source: Nutzerentscheidung zur Aufgabenübersicht (2026-09-15)

## Metadata

- Date: 2026-09-15
- Type: Nutzerkonversation mit UI-Referenz
- Location: Aufgabenübersicht
- Status: umgesetzt

## Summary

Die bisher sehr helle Aufgabenübersicht lässt Events, Kategorien, Status und einzelne Aufgaben ineinanderlaufen. Der Nutzer wählte die erste der drei vorgelegten Gestaltungsrichtungen: eine helle, aber kontrastreiche Arbeitsansicht mit dunklen Event-Köpfen und klar abgegrenzten Kategorien.

## Key Facts

- Kategorien müssen schneller unterscheidbar sein.
- Eine vollflächig helle Gestaltung ist für die Übersicht nicht förderlich.
- Statusfarben dürfen nicht mit Kategoriekennzeichnungen verwechselt werden.
- Gewählt wurde eine Gruppenansicht mit Event-Kopf, Kategorienkarte, nächstem Schritt und einklappbarem Workflow.

## Implications For Project

- Die globale Route `/aufgaben` verwendet in der Übersicht Gruppen nach Event und Kategorie statt einer direkten Datentabelle.
- Kategorien nutzen feste Icon-/Akzentfamilien; Dringlichkeit bleibt durch beschriftete Status-Tags mit separaten Semantikfarben sichtbar.

## Related Pages

- [Entscheidung: Kontrastorientierte Aufgabenübersicht](../decisions/2026-09-15-kontrastorientierte-aufgabenuebersicht.md)
- [Aufgabenplanung und Tabellen-Vertiefung](../concepts/task-planning-and-table-deepening-2026-09-15.md)
