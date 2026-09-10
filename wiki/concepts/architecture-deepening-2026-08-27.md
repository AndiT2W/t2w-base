# Architekturvertiefung vom 2026-08-27

## Entscheidungen

- Frameworkfreie CRM-, Event- und Auswahllisten-Module werden im npm-Workspace-Paket `@t2w/domain` geteilt. Frontend und Event-Service behalten ihre Framework- und Persistenzadapter außerhalb dieses Pakets.
- Die Event-Bearbeitung wird durch eine zusammenhängende Editing Session gekapselt. Sie besitzt Draft, Veranstalter-abhängige Rechnungs- und Auszahlungsdefaults, Validierung sowie die Übernahme frisch gespeicherter Server-Snapshots.
- Zentral gepflegte, aktivierbare Domainwerte heißen **Auswahllisten**. Sportarten und Eventrollen nutzen denselben Workspace mit HTTP-Adapter.
- Wiederverwendbares Tabellenverhalten besitzt Spaltensichtbarkeit, Sortierung und stabile Zeilenreihenfolge. Fachliche Filter bleiben gemäß [ADR-0001](../decisions/adr-0001-separate-crm-and-event-bounded-contexts.md) im jeweiligen Event- oder CRM-Workspace.
- Ressourcen-Navigation wird zentral als geordnetes Darstellungsmodell aufgelöst: Ein direkter Outlook-Web-Link hat Vorrang; der allgemeine Outlook-Einstieg ist nur der Legacy-Fallback. SharePoint-Pfade, Verfügbarkeit, Bezeichnungen und zugängliche Zustände entstehen an derselben Stelle. Tabellen, mobile Liste und Eventdetail rendern dieses Modell ohne eigenes Outlook-/SharePoint-Wissen.
- Der Audit-Log-Browsing-Workspace besitzt Laden, Entitätsfilter, lokale Freitextsuche, Fehlerzustand und CSV-Projektion. Nur die jüngste Ladeantwort wird übernommen; vorhandene Einträge bleiben bei Fehlern sichtbar und exportierbar.

## Evidenz

- [`packages/domain`](../../packages/domain)
- [`services/event-service/src/crm-command.adapter.ts`](../../services/event-service/src/crm-command.adapter.ts)
- [`src/lib/t2w/event-workspace.ts`](../../src/lib/t2w/event-workspace.ts)
- [`src/lib/t2w/selection-list-workspace.ts`](../../src/lib/t2w/selection-list-workspace.ts)
- [`src/components/t2w/table-model.ts`](../../src/components/t2w/table-model.ts)
- [`src/lib/t2w/folder-navigation.ts`](../../src/lib/t2w/folder-navigation.ts)
- [`src/lib/t2w/audit-log-workspace.ts`](../../src/lib/t2w/audit-log-workspace.ts)
- Benutzerentscheidungen im Architektur-Review vom 2026-08-27.

## Verifikation

- Unit-Regressionstests decken die Module einschließlich verspäteter Audit-Antworten, Fehlererhalt und CSV-Escaping ab.
- Der vollständige Event-Browser-Testlauf umfasst 31 Workflows einschließlich Persistenz- und Reload-Szenarien.
