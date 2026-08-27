# Architekturvertiefung vom 2026-08-27

## Entscheidungen

- Die Event-Bearbeitung wird durch eine zusammenhängende Editing Session gekapselt. Sie besitzt Draft, Veranstalter-abhängige Rechnungs- und Auszahlungsdefaults, Validierung sowie die Übernahme frisch gespeicherter Server-Snapshots.
- Zentral gepflegte, aktivierbare Domainwerte heißen **Auswahllisten**. Sportarten und Eventrollen nutzen denselben Workspace mit HTTP-Adapter.
- Wiederverwendbares Tabellenverhalten besitzt Spaltensichtbarkeit, Sortierung und stabile Zeilenreihenfolge. Fachliche Filter bleiben gemäß [ADR-0001](../decisions/adr-0001-separate-crm-and-event-bounded-contexts.md) im jeweiligen Event- oder CRM-Workspace.
- Ordnernavigation wird zentral aufgelöst: Ein direkter Outlook-Web-Link hat Vorrang; der allgemeine Outlook-Einstieg ist nur der Legacy-Fallback. SharePoint-Pfade werden an derselben Stelle normalisiert und kodiert.

## Evidenz

- [`src/lib/t2w/event-workspace.ts`](../../src/lib/t2w/event-workspace.ts)
- [`src/lib/t2w/selection-list-workspace.ts`](../../src/lib/t2w/selection-list-workspace.ts)
- [`src/components/t2w/table-model.ts`](../../src/components/t2w/table-model.ts)
- [`src/lib/t2w/folder-navigation.ts`](../../src/lib/t2w/folder-navigation.ts)
- Benutzerentscheidungen im Architektur-Review vom 2026-08-27.

## Verifikation

- Unit-Regressionstests decken alle vier Module ab.
- Der vollständige Event-Browser-Testlauf umfasst 31 Workflows einschließlich Persistenz- und Reload-Szenarien.
