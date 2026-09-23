# Domain Context

## Projektmanagement – Zielbegriffe

**Event**: Die konkrete Veranstaltung ist zugleich der operative Projektcontainer. Quelle: [bestätigter Nutzerauftrag vom 10.09.2026](wiki/sources/2026-09-10-user-event-readiness.md).

**Aufgabe**: Eine konkrete Arbeitseinheit innerhalb genau eines Planungsbereichs: eines Events oder der globalen Planung. Sie kann einem internen Benutzer oder bei Eventaufgaben einem Veranstalterkonto zugewiesen sein und besitzt ein dokumentiertes Ergebnis. Ihr Arbeitsstatus ist vom Lieferstatus und vom Eventstatus getrennt.

**Kategorie-Readiness**: Die aktuelle Planlage der erfassten Aufgaben eines Eventbereichs; sie belegt weder vollständige Erledigung noch die Vollständigkeit aller Eventanforderungen. Quelle: [PM-Spezifikation v3](wiki/tasks/project-management-spec-v3.md).

**Aufgabenabhängigkeit**: Die notwendige Erledigung einer Vorgängeraufgabe vor Beginn einer Nachfolgeraufgabe innerhalb desselben Planungsbereichs.

**Aufgabenablauf**: Die aus verbundenen Aufgaben eines Planungsbereichs abgeleitete Folge einschließlich paralleler Zweige; Übersicht und Tabelle beschreiben dieselbe Arbeit. Unabhängige Aufgaben bilden jeweils einen eigenen Ablauf. Quelle: Nutzerentscheidung vom 15.09.2026.

**Planungsschnappschuss**: Der nach einer Planungsintention gültige Zustand der Aufgaben, Abhängigkeiten und zugehörigen Planungsdaten. Er enthält bei Aufgabenintentionen die Identität der betroffenen Aufgabe, damit eine Ansicht sie nicht aus veränderlichen Eigenschaften wie dem Titel herleiten muss. Quelle: Nutzerentscheidung vom 19.09.2026.

**Globale Aufgabenprojektion**: Die für einen Benutzer sichtbare, zusammengeführte Planung aus globalen und Eventaufgaben, ihrem Eventkontext und ihren abgeleiteten Blockadegründen. Filter und Darstellung verändern diese Projektion nicht. Quelle: Nutzerentscheidung vom 19.09.2026.

## CRM workspace

The CRM workspace manages people, customer profiles, and their independent relationships. A person may have customer associations and event roles simultaneously. Removing a customer association preserves the person and any event roles.

## Event workspace

The Event workspace owns event participant and recipient rules: organizer assignment, payout recipients, invoice recipients, contact roles, deletion eligibility, defaults, and optimistic-concurrency behavior. Multi-relationship commands are atomic. Referenced organizers are not deleted; they may be deactivated.

An Event record is the authoritative detailed snapshot of an Event together with the relations needed by Event workflows. Event record retrieval is separate from Event mutation intent: callers receive a refreshed record after a successful change without knowing how its persistence projection is assembled.

## Event detail workspace

The Event detail workspace coordinates a single Event detail interaction. It owns searches, selections, recipient projections, persistence progress, and user-facing outcomes while delegating Event persistence to an Event editing session. Visual presentation state such as tabs and dialogs is not part of the Event detail workspace.

A TIME2WIN synchronization outcome is a user-facing result of refreshing the linked TIME2WIN Event. A failed outcome does not block Event editing and preserves the last successful TIME2WIN snapshot.

**Event communication display**: The searchable, filterable account of messages and recorded activities for one Event, shown as a chronological history or grouped conversations. It answers what happened and where to find it; replies and completion remain in Outlook. Source: [communication display decision](wiki/concepts/communication-display-design.md), 2026-09-19.

## Table preferences

Table behavior consists of generic column definitions, persisted visibility, locale-aware sorting, stable ordering, and preference recovery. Domain-specific filtering remains owned by the containing workspace. Browser storage is an adapter, not part of the table behavior’s core interface.

**Event list presentation**: The shared visible Event rows and mobile cards used by Übersicht and Veranstaltungen. Each view retains its own Event selection and filter criteria. Source: [Event list display foundation](wiki/concepts/event-list-display-design.md), 2026-09-19.

## Selection lists

A selection list is a centrally managed set of domain-named values offered as choices in Event workflows. Values can be activated or deactivated without rewriting existing Event data. Active values are available for selection; management views also include inactive values. Sport types and Event roles are selection lists.

Each selection list has one persisted order. Reordering is atomic: a list shows either its complete prior order or its complete new order. Existing values receive a deterministic alphabetical initial order when ordering is introduced.

An inactive Event role remains visible for an existing Event-contact assignment, but is not available for a new assignment.

## Benutzerzugriff

**Systemrolle**: Die Zugriffsart eines Benutzerkontos. `Admin` und `Benutzer` sind interne Rollen; `Veranstalter` ist eine externe, auf konkret zugewiesene Eventaufgaben begrenzte Rolle.
_Avoid_: Eventrolle, Finanzrolle

**Finanzzugriff**: Die benutzerbezogene Berechtigung, Finanzmodule und geschützte Finanzdaten zu sehen. Admins besitzen den Finanzzugriff immer; bei normalen internen Benutzern wird er ausdrücklich ein- oder ausgeschaltet; Veranstalterkonten besitzen ihn nie.
_Avoid_: Rolle Finanzen

**Veranstalterkonto**: Ein externes Login, das genau einem Veranstalter-Stammsatz zugeordnet ist. Sein Zugriff entsteht ausschließlich durch persönlich zugewiesene Eventaufgaben, nicht allein durch die Veranstalterbeziehung zum Event.
_Avoid_: Veranstalter-Stammsatz, Eventrolle Veranstalter

## Architectural vocabulary

- Framework-free domain behavior shared by browser and backend lives in the `@t2w/domain` workspace package. React, HTTP, local persistence, Nest, and Prisma remain adapters at seams.
- A workspace module presents a small intent-level interface and returns refreshed domain state.
- HTTP, local persistence, database, and browser storage are adapters behind seams.
- Tests cross the module interface; persistence and storage adapters are replaceable in tests.
