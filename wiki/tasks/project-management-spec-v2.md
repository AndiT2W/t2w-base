---
title: Integriertes Projektmanagement für t2w-base – Version 2
type: specification
status: superseded
updated: 2026-09-10
sources:
  - project-management-spec.md
  - ../decisions/2026-09-09-systembenutzer-und-berechtigungen.md
---

# Integriertes Projektmanagement – Version 2

**Ersetzt am 10.09.2026 durch [Spezifikation v3](project-management-spec-v3.md).** Diese Fassung bleibt historisch. Für Issue #55 gelten Aufgabenabhängigkeiten, daraus abgeleitete Ablaufübersicht und aufklappbare Tabellen gemäß v3; widersprechende Umfangsangaben unten sind nicht mehr maßgeblich.

**UX-Ergänzung vom 10.09.2026:** Für die neue Kategorie-Readiness zuerst die [Readiness-Spezifikation](project-management-readiness-spec.md) lesen. Der aktuelle Nutzerauftrag ersetzt den Einstieg über Dashboard-Kacheln und vollständige Aufgabenlisten durch fachliche Kategorieabschnitte. Die Ergänzung dokumentiert Konflikte dieser Fassung mit dem bestätigten MVP; das zusätzliche Prüfmodell bleibt bis zur Produktentscheidung ein Vorschlag.

Version 2 ist das umsetzungsorientierte Zielbild; sie ersetzt [Version 1](project-management-spec.md), ohne deren Historie zu löschen. **Muss** bedeutet Abnahmeregel für eine künftige Umsetzung, nicht bestehenden Code. **Vorschlag** ist eine bewusste Erweiterung. **Offen** verlangt eine Produktentscheidung.

Die umsetzbare Zusammenfassung ist als GitHub-Issue [#55](https://github.com/AndiT2W/t2w-base/issues/55) mit `enhancement` und `ready-for-agent` veröffentlicht.

## 1. Ziel, Nutzen und verifizierter Ausgangspunkt

**Zielbild.** Mitarbeitende steuern die operative Arbeit eines Events am Ort der fachlichen Daten: Termine, Verantwortlichkeit, Gruppen, Priorität, nächster Schritt, Lieferungen und ein Aktivitätslog sind nachvollziehbar mit Event, Serie, Kontakt, Kommunikation, Hardware und Finanzen verbunden. Die globale Sicht beantwortet zuverlässig: Was ist offen, heute fällig, überfällig, hoch priorisiert oder nicht zugewiesen? Ein externes Parallelprojekt und ClickUp als Laufzeitabhängigkeit sind ausgeschlossen.

| Nutzerproblem | Muss: Ergebnis |
| --- | --- |
| Checkboxen zeigen weder Arbeitsstand noch Ursache eines Verzuges. | Eigenständiger Status, Frist, nächster Schritt, Priorität und Verlauf. |
| Jahres-Events starten immer wieder bei null oder kopieren Altlasten. | Versionierte Serienvorlagen erzeugen neue Instanzen; kein Vorjahreszustand wird verändert. |
| Kontakt, Mail, Hardware und Auszahlung stehen neben der Arbeit. | Referenzen verlinken vorhandene Datensätze, ohne deren Daten zu duplizieren. |
| Führung sieht nur lokal geladene Events. | Serverseitige, paginierte Aufgaben- und Summenabfragen. |

### Nachweisbarer Ist-Stand

| Befund | Evidenz im Repository | Konsequenz für das Zielbild |
| --- | --- | --- |
| `EventTask` enthält nur `title`, `dueAt`, `responsible`, `completed` und Zeitstempel; bei Event-Löschung Cascade. | [schema.prisma](../../services/event-service/prisma/schema.prisma) | Das Modell wird additiv migriert; Checkbox ist kein ausreichender Lebenszyklus. |
| Das Event hat `seriesId` als UUID, aber kein `EventSeries`-Modell. | [schema.prisma](../../services/event-service/prisma/schema.prisma), [event-mutations.ts](../../services/event-service/src/event-mutations.ts) | **Vorschlag:** explizite Serienentität, bestehende IDs bleiben stabil. |
| Task-POST/PATCH verlangen aktuell die Eventversion und liefern das Event zurück. | [events.controller.ts](../../services/event-service/src/events.controller.ts), [event-mutations.ts](../../services/event-service/src/event-mutations.ts) | Neuer Taskvertrag hat eigene Version; Legacy bleibt nur übergangsweise kompatibel. |
| Die Adaptermethoden schreiben Taskdaten ohne Audit. | [prisma-event-mutation.adapter.ts](../../services/event-service/src/prisma-event-mutation.adapter.ts) | Jede neue PM-Mutation läuft in einer Transaktion mit Audit. |
| `AuditService.append` akzeptiert einen Transaktionswriter; `AuditLog` ist append-only dokumentiert. | [audit.service.ts](../../services/event-service/src/audit.service.ts), [schema.prisma](../../services/event-service/prisma/schema.prisma) | Diesen Seam nutzen, nicht einen zweiten Verlauf erfinden. |
| Eventdetail bietet Aufgaben-Eingabe und Checkbox; `/aufgaben` projektiert geladene, nicht archivierte Events clientseitig. | [events.$eventcode.tsx](../../src/routes/events.$eventcode.tsx), [aufgaben.tsx](../../src/routes/aufgaben.tsx), [event-projections.ts](../../src/lib/t2w/event-projections.ts) | Beide Ansichten werden auf denselben Serververtrag umgestellt. |
| API-Mapping reduziert Tasks auf das alte Feldmodell. | [api.ts](../../src/lib/t2w/api.ts), [types.ts](../../src/lib/t2w/types.ts) | Neue PM-Typen getrennt von der Legacy-Eventprojektion einführen. |
| Interne Konten haben `ADMIN`/`MITARBEITER`, `active`; Rechte müssen serverseitig gelten. | [schema.prisma](../../services/event-service/prisma/schema.prisma), [Systembenutzer-Entscheidung](../decisions/2026-09-09-systembenutzer-und-berechtigungen.md) | Keine Rechte aus Eventkontaktrollen ableiten. |
| Kommunikation, Hardware und Auszahlungen sind bereits Eventrelationen. | [schema.prisma](../../services/event-service/prisma/schema.prisma) | PM referenziert sie über polymorphe Referenzen, besitzt sie nicht. |

## 2. Begriffe und Grenzen

| Begriff | Bedeutung | Nicht gleichbedeutend mit |
| --- | --- | --- |
| **Event** | Konkrete, zeitlich datierte Veranstaltung; der operative Projektcontainer. | Eventserie oder Aufgabe. |
| **Eventserie** | Stabile Klammer wiederkehrender Events und ihrer künftigen Standards. | Vorjahresevent als Kopiervorlage. |
| **Aufgabe** | Konkrete, zu genau einem Event gehörige Arbeitseinheit. | Kommunikationsnachricht, Hardwarefall oder Auszahlung. |
| **Aufgabenserie** | Stabile Vorlage innerhalb einer Eventserie mit fachlicher Identität. | Eine ausgeführte Aufgabe. |
| **Aufgabeninstanz** | Aus einer bestimmten Vorlagenrevision für ein konkretes Event erzeugte Aufgabe. | Live-Verbindung zur Vorlage. |

**Muss:** Es gibt kein paralleles `Project`-Aggregate. Eventdaten bleiben im Event; Kontakte bleiben `Contact`/`EventContact`, Nachrichten `EventCommunicationMessage`/`EventActivity`, Hardware `HardwareIssue`, Finanzen `Payout`. Eine Aufgabe kann darauf verweisen, aber deren Status nie ändern.

## 3. Zustandsmodelle und exakte Fachregeln

### 3.1 Arbeitsstatus und effektiver Status

Der MVP speichert nur einen einfachen Arbeitsstatus. Abhängigkeiten, Wartezustand, Blocker und Risikofälle sind bewusst spätere Inkremente; sie werden nicht durch versteckte Felder vorweggenommen.

| Gespeicherter Status | Zulässige Übergänge | Muss-Bedingung |
| --- | --- | --- |
| `NEW` | `IN_PROGRESS`, `CANCELLED` | Titel, Event vorhanden. |
| `IN_PROGRESS` | `DONE`, `CANCELLED` | Aktiver Owner, gültige Gruppe und nächster Schritt für Beginn. |
| `DONE` | `NEW`, `IN_PROGRESS` | Wiederöffnungsgrund dokumentieren. |
| `CANCELLED` | `NEW`, `IN_PROGRESS` | Stornogrund; nicht als erledigt zählen. |

| Regel | Muss |
| --- | --- |
| Überfällig | Offen (`NEW`/`IN_PROGRESS`) und Fristgrenze ist erreicht. Ohne Frist nie überfällig. Tagesfrist endet um 00:00 des Folgetags in der Event-IANA-Zeitzone, Zeitpunktfrist exakt zum gespeicherten UTC-Zeitpunkt. Überfälligkeit ist eine Anzeige, kein Status und blockiert Abschluss oder Storno nie. |
| Priorität | `NORMAL` (Standard) oder `HIGH`; sie ist reine Sortier-/Filterinformation, verlangt keine Begründung und löst keine automatische Nachricht aus. |
| Risiken, Red Flags, Rückmeldungen, Blocker, Abhängigkeiten | **Nicht im MVP.** Diese Zustandsmodelle sind spätere, eigenständige Erweiterungen; Überfälligkeit ersetzt sie nicht. |
| Versand/Lieferung | **Ab Inkrement 2:** eigenes Zustandsmodell, nicht `workflowStatus`: `NOT_REQUIRED`, `PLANNED`, `PREPARED`, `SENT`, `PARTIALLY_DELIVERED`, `DELIVERED`, `RETURNED`, `FAILED`, `CANCELLED`. `SENT` ist nicht geliefert. Abschluss einer Lieferaufgabe nur bei `NOT_REQUIRED`, `DELIVERED`, `RETURNED` oder begründetem `CANCELLED`. |

Friständerung und Wiederöffnung verlangen Grund. Abschluss verlangt Ergebnisnotiz; ab Inkrement 2 zusätzlich erfüllten Lieferstatus, falls die Aufgabe eine Lieferaufgabe ist. Wird ein Owner oder eine Gruppe nachträglich deaktiviert, bleibt eine laufende Aufgabe in `IN_PROGRESS`, erscheint aber als „Zuweisung prüfen“; die nächste inhaltliche Änderung oder der Abschluss verlangt wieder aktiven Owner, gültige Gruppe und nächsten Schritt.

## 4. Wiederkehrung und unveränderliche Vergangenheit

**Vorschlag:** `TaskTemplate` besitzt eine stabile ID, `TaskTemplateRevision` enthält einen unveränderlichen Snapshot. Relative Fristen sind `NONE | EVENT_START | EVENT_END` plus Kalendertag-Offset und optionale Ortszeit; Wochenenden werden nicht implizit verschoben.

| Vorgang | Muss |
| --- | --- |
| Übernahme | Atomar und idempotent über `applicationKey`; je Event und Vorlagen-ID höchstens eine Instanz. Neue IDs, neue eventinterne Kanten, `NEW`, keine Kommentare/Risiken/Blocker/Sendungen/Abschlüsse. |
| Revision | Änderung erzeugt Revision, überschreibt weder Instanzen noch ältere Revisionen. Sie gilt nur für spätere Übernahmen. |
| Datumsverschiebung | Nur offene, relativ geplante Instanzen erscheinen in einer Vorschau; manuell gesetzte und terminale Fristen bleiben. Bestätigung prüft Versionen erneut. |
| Vorjahresdaten | Serienvorlagen dürfen niemals Event, Aufgaben, Historie oder Fristen vergangener Jahre verändern. |
| Neues Jahres-Event | **Muss niemals** abgeschlossene Aufgaben, Kommentare, Risiken, Blocker, Auditdaten, Versand- oder Lieferdaten kopieren. |

## 5. Informationsarchitektur und Ansichten

| Ort | Muss-Inhalt |
| --- | --- |
| Event `/events/$eventcode` | Reiter „Projektmanagement“ im vorhandenen Workspace: Kennzahlen (offen, überfällig, hoch priorisiert, nicht zugewiesen), Bereichsfortschritt, Liste und Abgeschlossen, Detail-Sheet sowie Verlinkungen zu Kontakt, Kommunikation, Hardware und Finanzen. Eventkopf bleibt sichtbar. |
| Global `/aufgaben` | Dashboard und Liste über **serverseitig** gefilterte Aufgaben aller lesbaren Events; Event und Serie immer sichtbar. Keine Kopie der Eventaufgaben. |
| Liste | Suche, gespeicherte URL-Filter, Cursor, sortierbare Spalten: Titel, Event, Bereich, effektiver Status, Owner, Priorität, Frist, Warnungen, nächster Schritt. |
| Kanban / Kalender | **Nach MVP:** Kanban für die vier Arbeitsstatus und Kalender für Fristen. Beide benutzen ausschließlich dieselben Serverdaten wie die Liste; keine zweite Zustandslogik. |
| Dashboard | Nicht additiv überlappende Kennzahlen: offen, heute/7 Tage, überfällig, hoch priorisiert, nicht zugewiesen und Bereichsfortschritt. |

## 6. Berechtigungen, Historie und Löschung

| Akteur | Muss-Rechte |
| --- | --- |
| Aktiver `MITARBEITER` | Lesen, anlegen, bearbeiten, kommentieren, Status- und operative PM-Aktionen in normalen Eventabläufen. |
| Aktiver `ADMIN` | Zusätzlich Vorlagen/Kategorien verwalten, archivierte Inhalte reaktivieren, Kommentare begründet moderieren, Nutzer-/Systemverwaltung wie entschieden. |
| Inaktiver User | Kein Zugriff. Historische Referenz und Auditautor bleiben erhalten. |

Alle Rechte werden im Nest-Service geprüft; ausgeblendete UI ist keine Autorisierung. Eventkontaktrollen sind fachliche Kontaktrollen, keine Loginrollen. n8n nutzt einen widerrufbaren, auditierbaren Service-Token mit ausschließlich lesendem PM-Scope statt einer Benutzer-Session.

**Muss:** Archivierung ist Lesbarkeit mit Schreibschutz. Ein Event mit offenen Aufgaben darf nicht archiviert werden. Physisches Löschen eines Events mit PM-Historie wird abgelehnt; ein Löschkonzept mit rechtlich freigegebener anonymisierender Aufbewahrung ist **offen**. Somit darf die heutige Cascade-Beziehung von `EventTask` nicht unverändert für PM-Historie bleiben.

`TaskActivity` ist ein für Anwender sichtbares, ClickUp-artiges Aktivitätslog: Erstellen, Zuweisung, Gruppe, Priorität, Frist, Status, Lieferung und Serienübernahme erscheinen chronologisch mit Autor/System und Zeit. Es ist append-only. Kommentare folgen nach dem MVP als eigene Aktivitätsart mit eigener Revision und können nur nachvollziehbar zurückgezogen werden. `AuditLog` bleibt der append-only Sicherheitsnachweis; je Fachmutation entstehen Audit und Aktivität in derselben DB-Transaktion.

## 7. Ziel-Datenmodell (Prisma)

| Modell / Enum | Wichtige Felder und Relationen | Constraints/Indizes |
| --- | --- | --- |
| `EventSeries` | `id`, `name`, `active`, `createdAt`; `events`, `taskTemplates` | PK UUID; `Event.seriesId → EventSeries.id`, Index `[seriesId,startAt]` bleibt. |
| `TaskCategory` | `id`, `name`, `active`, `sortOrder` | `name` unique; historische Deaktivierung statt Löschung. |
| `EventTask` | Bestehende ID/Event + `description`, `categoryId`, `assigneeId?`, `workflowStatus`, `priority`, `dueKind`, `dueAt?`, `dueDate?`, `timezone`, `nextStep`, `delayReason?`, `version`, `completedAt?`, `completedById?`, `cancelledAt?`, `archivedAt?`, `templateId?`, `templateRevision?`, `deliveryStatus` | `workflowStatus`: nur `NEW`, `IN_PROGRESS`, `DONE`, `CANCELLED`; `priority`: nur `NORMAL`, `HIGH`. `eventId` Restrict für PM-Löschschutz; Index `[eventId,workflowStatus,dueAt]`, `[assigneeId,workflowStatus,dueAt]`, `[priority,dueAt]`, `[updatedAt,id]`; Check: genau passende Fristfelder je `dueKind`. |
| `TaskDependency`, `TaskBlocker`, `TaskRisk`, `TaskWaitingEpisode` | **Nach MVP, nicht vorab anlegen.** | Bei Einführung: eventinterne Zyklus-/Statusregeln als eigener Vertrag. |
| `TaskDelivery` | `taskId`, `status`, Carrier/Tracking?, `sentAt?`, `deliveredAt?`, `version` | Index `[taskId,status]`; mehrere Sendungen möglich. |
| `TaskReference` | `taskId`, `kind`, `targetId`, `labelSnapshot?` | unique `[taskId,kind,targetId]`; `kind`: CONTACT, COMMUNICATION, HARDWARE_ISSUE, PAYOUT, EVENT_FILE. |
| `TaskActivity` | `taskId`, `kind`, strukturierter Feldänderungssnapshot, Autor/System, Zeit | Append-only, Cursorindex `[taskId,createdAt,id]`; sichtbares ClickUp-artiges Aktivitätslog. Kommentare folgen später als eigene Aktivitätsart mit eigener Revision. |
| `TaskTemplate`, `TaskTemplateRevision`, `TaskTemplateDependency`, `TaskTemplateApplication` | Serienbindung, Revision-Snapshot, relative Frist, Übernahmelauf | unique `[seriesId,stableKey]`, `[eventId,templateId]`, idempotency key unique. |

Enums: `TaskWorkflowStatus`, `TaskPriority`, `TaskDueKind`, `TaskDeliveryStatus`, `TaskReferenceKind`. **Muss:** Task- und Lieferstatus sind getrennte Enums und niemals ineinander gemappt.

## 8. API-Vertrag (Zielbild)

Alle Pfade relativ zu `/api/v1`, JSON, UUIDs, Sessionauthentifizierung. Listen liefern `{ items, nextCursor, total, asOf }`; Detailmutationen `{ task, version }`.

| Methode / Pfad | Vertrag |
| --- | --- |
| `GET /tasks`, `GET /tasks/summary` | Global und auch für n8n, Cursor/`limit`, `q`, `eventId[]`, `seriesId[]`, `assigneeId[]`, `status[]`, `priority[]`, `categoryId[]`, `overdue`, `dueFrom`, `dueTo`, `dueMissing`, `archived`, `updatedSince`, `sort`. |
| `GET/POST /events/:eventId/tasks` | Eventscope; POST: `title`, optional Planfelder, `expectedVersion` für Event-Änderung nur während Legacy-Übergang. |
| `GET/PATCH /events/:eventId/tasks/:taskId` | PATCH mit `expectedVersion`; Frist/Priorität/Owner/Planfelder und erforderlichem Änderungsgrund. |
| `POST /events/:eventId/tasks/:taskId/actions` | `start`, `complete`, `cancel`, `reopen`, `archive`, `unarchive`; typisierte Payload. |
| `GET .../activity` | Cursorpaginierte, sichtbare chronologische Aktivitäten: Erstellen, Status, Owner, Gruppe, Priorität, Frist, Lieferstatus und Serienübernahme. |
| `POST/PATCH .../deliveries`; `POST/DELETE .../references` | Lieferungen und Referenzen; fachliche Änderungen erhöhen Taskversion und erzeugen Aktivität plus Audit. |
| `GET/POST/PATCH /event-series/:seriesId/task-templates` | Lesen, neue Vorlage/Revision, deaktivieren; Admin für Änderung. |
| `POST /events/:eventId/task-template-preview`, `POST .../task-template-applications` | Vorschau und idempotente Übernahme mit `idempotencyKey`. |

Beispiel Abschluss: `POST .../actions {"action":"complete","expectedVersion":7,"outcome":"Startlisten liegen vor."}`. Beispiel Konflikt: `409 {"code":"TASK_VERSION_CONFLICT","currentVersion":8}`. Fehler: `400` Syntax, `401` keine Session, `403` Recht, `404` Scope/Ressource, `409` Version/Zyklus/Idempotenzhash, `422` fachliche Übergangsvoraussetzung mit `fieldErrors`.

## 9. Frontend, Transaktionen und Konflikte

**Vorschlag:** `src/lib/t2w/project-management/` kapselt DTOs, Querykeys, Zeit-/Statusprojektion und Command-Adapter. `src/routes/events.$eventcode.tsx` integriert den Eventscope, `src/routes/aufgaben.tsx` den Globalscope. Bestehende Card, Tabs, Sheet, Badge, Filter- und Event-Link-Komponenten werden wiederverwendet; vorhandene Legacy-Funktionen aus [api.ts](../../src/lib/t2w/api.ts) bleiben nur bis Entfernung der Legacy-Tasks.

Jeder Command nutzt `expectedVersion`. Der Service führt Taskmutation, Statusprüfung, `TaskActivity` und `AuditService.append(..., tx)` in **einer** Prisma-Transaktion aus. Auditfehler rollt die Sachmutation zurück. Bei einem späteren Kommentar besitzt dieser zusätzlich eine eigene Version. Abhängigkeits- und Vorlagenbefehle sperren/serialisieren bei ihrer Einführung den Eventplan und prüfen den Zyklus innerhalb derselben Transaktion. Ein Idempotency-Key mit abweichendem Requesthash ist `409`; gleiche Wiederholung liefert das Originalergebnis. Konflikt-UI zeigt aktuellen Wert und verwirft keinen lokalen Entwurf still.

## 10. Migration

1. Additive Migration: Enums/Tabellen/nullable Felder, `EventSeries` aus existierenden stabilen `seriesId`; keine Seriennamen aus Annahmen erzeugen.
2. Vor dem Schnitt einen einmaligen, zugriffsgeschützten JSON/CSV-Snapshot der bisherigen `EventTask`-Datensätze erzeugen und Run-ID, Hash, Speicherort und ausführenden Systembenutzer auditieren.
3. Nach geprüfter Snapshot-Erstellung bisherige Checkbox-Tasks **nicht migrieren**, sondern kontrolliert entfernen. Es werden weder alte IDs, Fristen, `completed` noch Freitext-`responsible` in neue PM-Aufgaben überführt.
4. Vor Aktivierung Löschpfad von Cascade auf Historienerhalt für die neuen PM-Tabellen umstellen; Snapshotvollständigkeit und Entfernen in Staging prüfen.
5. Rollout: Aufgabenbasis → sichtbares Aktivitätslog und Lieferungen → globale Ansichten → Vorlagen → spätere Kommentare/Abhängigkeiten/Blocker/Risiken. Keine destruktive Rückmigration nach PM-Schreibvorgängen.

## 11. Nichtfunktionale Anforderungen und Tests

| Bereich | Muss |
| --- | --- |
| Performance | Cursorpagination, selektive Includes, serverseitige Aggregate; keine Vollabfrage aller Events im Browser. Detailkinder separat paginieren. |
| Mobile/A11y | 360 px nutzbar, Tastaturpfad ohne Drag, sichtbarer Fokus, semantische Tabellen/Buttons, Screenreader-Text für Warnungen, Kontrast und Fehlerzuordnung. |
| i18n/Zeit | Texte über bestehende Übersetzungsschicht; UTC speichern, Eventzone anzeigen; DST-Testfälle. |
| Sicherheit | DTO-Whitelist/Validierung, Scope- und Rollenprüfung im Service, lesender n8n-Service-Token mit Widerruf/Audit, keine fremden `targetId` ohne Existenz-/Sichtbarkeitsprüfung, XSS-sicher gerenderte spätere Kommentare, Rate Limits für Mutationen. |

| Ebene | Konkrete Regressionen |
| --- | --- |
| Domain | Fristgrenzen inklusive DST; Überfälligkeit blockiert keinen Abschluss; Status- und Lieferinvarianten; relative Fristen und Owner-/Gruppenvalidierung. |
| PostgreSQL-Integration | Atomare Fachmutation+Audit+Aktivität; gleichzeitige Versionsupdates; Idempotenz; Restrict bei Eventlöschung; Snapshot- und Löschablauf für Legacy-Tasks. |
| Browser E2E | Anlegen→Reload→Abschluss; Aktivitätslog für Zuweisung/Gruppe/Frist; Lieferabschluss; globale Filter/Deep-Link/Pagination; Serienvorschau/zweifache Übernahme; Archiv/Löschschutz; Tastatur/Mobil. Spätere Suites decken Kommentare, Abhängigkeiten und Kanban ab. |

**Muss:** Jede zusätzliche Funktion erhält nach [AGENTS.md](../../AGENTS.md) einen relevanten, echten Browser-Regressionstest mit Persistenz nach Reload; neue Suites beispielsweise `tests/e2e/project-management*.spec.ts`.

### Abnahmebeispiele

| ID | Given / When | Then |
| --- | --- | --- |
| AK-01 | Eine offene Tagesfrist vom 10.09. in `Europe/Vienna`; Referenzzeit 10.09. 16:00. | Nicht überfällig. Ab 11.09. 00:00 ist sie überfällig; Browserzeitzone ändert das nicht. |
| AK-02 | Eine überfällige Aufgabe mit `HIGH`-Priorität wird erledigt. | Überfälligkeit ist sichtbar, blockiert den Abschluss aber nicht; Aktivitätslog und Audit nennen Abschluss. |
| AK-03 | Owner, Gruppe und Frist werden nacheinander geändert. | Ein ClickUp-artiges Aktivitätslog zeigt drei unveränderliche, chronologische Ereignisse mit Benutzer und Zeit. |
| AK-04 | Lieferaufgabe mit einer gesendeten und einer teilgelieferten Sendung wird abgeschlossen. | Abschluss wird abgelehnt; Versand gilt nicht als Lieferung. |
| AK-05 | Zwei Anfragen ändern Version 4 derselben Aufgabe. | Eine schreibt Version 5 mit Aktivität und Audit; die andere erhält 409, ohne Datenverlust. |
| AK-06 | Eine Serienvorlage wird zweimal, auch parallel, auf dasselbe neue Event angewandt. | Genau eine Instanz je Vorlage; keine Vorjahresaufgabe, kein Aktivitätslog, Risiko oder Audit wird kopiert oder verändert. |
| AK-07 | Ein Event mit PM-Historie wird physisch gelöscht oder mit offenen Tasks archiviert. | Der Service lehnt ab; Historie bleibt lesbar. |
| AK-08 | Ein Mitarbeitender legt eine Aufgabe an, lädt neu und öffnet sie bei 360 px nur per Tastatur. | Persistente Aufgabe; Statuswechsel, Filter und Detail-Sheet sind ohne Drag-and-drop bedienbar. |

## 12. Risiken, Entscheidungen und Phasen

### Drei wichtigste Produktfragen

| Offen | Vorschlag |
| --- | --- |
| Wann sollen Risiken/Red Flags tatsächlich eingeführt werden? | Erst nach einem stabilen MVP; dann als eigenes Zustandsmodell, nie als automatische Folge einer Überfälligkeit. |
| Welche Aufbewahrung erlaubt physische Eventlöschung? | Bis zu einer dokumentierten Rechts-/Betriebsentscheidung: nur Archivierung, Löschen bei PM-Historie blockieren. |
| Brauchen Fristen Arbeitstage/Feiertage und mehrere Eventzeitzonen? | MVP: `Europe/Vienna`, Kalendertage und Zeitpunktfristen; später Betriebskalender. |

### Fünf größte technische Risiken

1. **Muss:** Legacy-Cascade könnte PM-Historie beim Eventlöschen vernichten.
2. **Muss:** Ein unvollständiger oder unzugänglicher Legacy-Snapshot vor dem kontrollierten Löschen alter Checkbox-Aufgaben wäre irreversibler Datenverlust.
3. **Muss:** Zyklusfreiheit und Abschlüsse sind bei parallelen Mutationen ohne transaktionale Graphprüfung inkonsistent.
4. **Muss:** Der bestehende Client-Projection-Ansatz unterschlägt ungeladene Events und skaliert nicht.
5. **Muss:** Zwei konkurrierende Versionsmechanismen (Event und Task) können Entwürfe überschreiben, wenn der Übergangsvertrag unsauber bleibt.

### Phasenplan und realistischer MVP-Schnitt

| Inkrement | Umfang und Akzeptanz |
| --- | --- |
| 0 – Entscheidung/Spike | Fristmigration, Aufbewahrung, Rechte, Lastprofil verbindlich entscheiden; Daten-/Migrationsprobe. |
| 1 – MVP | Additives Taskmodell, eigene API, Liste im Event und global, Owner/administrierbare Gruppe/Priorität/Frist, `NEW/IN_PROGRESS/DONE/CANCELLED`, sichtbares Aktivitätslog, n8n-Lesevertrag, serverseitige Filter, Version+Audit, Browser-E2E. Kein Kanban, Kalender, Kommentar, Risiko, Blocker oder Abhängigkeit. |
| 2 – Betriebsfähigkeit | Lieferstatus, Dashboard, Löschschutz und Serienvorlagen mit revisionierter Vorschau, idempotenter Übernahme sowie Terminverschiebung. Lieferstatus erweitert den Abschluss erst in diesem Inkrement. |
| 3 – Zusammenarbeit | Kommentare und lesbarer Detailverlauf; danach Wartezustand, Blocker und eventinterne Abhängigkeiten als zusammenhängender Fachslice. |
| 4 – Komfort/Skalierung | Risiken/Red Flags nur nach neuer Produktentscheidung, Kanban, Kalender, gespeicherte Ansichten, Accessibility-/Mobile- und Performance-Abnahme. |

Der MVP liefert damit den täglichen Nutzen ohne riskante automatische Vorjahreskopie; alle späteren Inkremente bleiben auf demselben Event- und Auditmodell.
