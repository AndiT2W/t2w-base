# Decision: Kontrastorientierte Aufgabenübersicht

## Status

- Accepted, 2026-09-15

## Context

Die dichte Tabellenansicht der globalen Aufgabenliste machte Gruppen und Kategorien nicht unmittelbar erkennbar. Die zuvor beschlossene Tabellenverdichtung bleibt für die übrigen operativen Listen gültig, ist aber für die Aufgabenübersicht nicht die bevorzugte Informationsarchitektur.

## Decision

- `/aufgaben` gruppiert die Übersicht nach Event und Kategorie.
- Jedes Event erhält einen dunklen Kopf mit offener Aufgabenanzahl und Fälligkeitssignal.
- Jede Kategorie ist eine weiße Karte mit einer festen Akzentleiste und einem Lucide-Icon; Hardware, Anmeldung und Finanzen erhalten unterschiedliche, nicht-warnende Kategorienkennzeichnungen.
- Kritisch, fällig, in Arbeit und erledigt bleiben separat beschriftete Status-Tags mit eigenen Semantikfarben.
- Die Übersicht zeigt nur den nächsten Schritt. Der vollständige Workflow wird auf ausdrücklichen Klick aufgeklappt; Aufgaben öffnen weiterhin das gemeinsame Detail-Sheet.
- Filter, Gantt und die zugrundeliegende Aufgabenprojektion bleiben unverändert.

## Consequences

- Die globale Aufgabenübersicht priorisiert Scanbarkeit vor maximaler Tabellendichte.
- Die aktuelle Zuordnung der Kategoriekennzeichnung ist absichtlich robust gegenüber unbekannten Gruppen: nicht erkannte Kategorien erhalten eine neutrale Standarddarstellung.
- Der Browser-Regressionstest deckt Gruppierung, Hardware-Kategoriekennung, Workflow-Aufklappen, Filter, Gantt und Mobilansicht ab.

## Evidence

- [Nutzerentscheidung zur Aufgabenübersicht](../sources/2026-09-15-user-task-overview-hierarchy.md)
- [Aufgabenroute](../../src/routes/aufgaben.tsx)
- [PM-Browser-Regression](../../tests/pm-e2e/project-management.spec.ts)
