## Problem Statement

Hardware wird bei Events an Teilnehmer, Timer oder externe Firmen ausgegeben und muss anschließend nachverfolgt und retourniert werden. Die aktuelle ClickUp-Liste ersetzt keine integrierte operative Funktion: Vorgänge sind nicht direkt am Event verfügbar, eventübergreifende Übersicht und Fälligkeiten fehlen, und die Daten sind nicht für spätere Inventarverknüpfungen strukturiert.

## Solution

Die Event-Domain erhält eine Hardware-Verwaltung mit einem Hardware-Reiter in der Event-Detailansicht sowie einer zentralen Hardware-Seite. Hardware-Vorgänge werden eventbezogen gespeichert, über bestehende Domain-, Service-, Repository-, Prisma-, API- und UI-Muster verwaltet und können später von n8n gelesen und aktualisiert werden. Ausgabeart, Status, Objekt, strukturierte Objektnummern und Fälligkeit werden getrennt modelliert.

## User Stories

1. Als Event-Mitarbeiter möchte ich Hardware-Ausgaben direkt im Event sehen, damit ich Rückgaben ohne ClickUp prüfen kann.
2. Als Event-Mitarbeiter möchte ich einen Hardware-Vorgang anlegen, bearbeiten und löschen können, damit die Ausgabe vollständig gepflegt bleibt.
3. Als Mitarbeiter möchte ich die Ausgabeart Teilnehmer, Verleih oder Sonstige erfassen, damit Ausgabeart und Rückgabestatus nicht vermischt werden.
4. Als Mitarbeiter möchte ich Objekt und Objektnummer getrennt erfassen, damit spätere Inventarobjekte angebunden werden können.
5. Als Mitarbeiter möchte ich Einzelgeräte mit Anzahl 1 erfassen, damit einzelne Seriennummern nachvollziehbar bleiben.
6. Als Mitarbeiter möchte ich Seriennummern als Range mit Prefix, Von, Bis und Padding erfassen, damit Bereiche wie T2W001–T2W100 strukturiert gespeichert werden.
7. Als Mitarbeiter möchte ich die Anzahl einer eindeutigen Range automatisch berechnen lassen, damit Eingabefehler vermieden werden.
8. Als Mitarbeiter möchte ich führende Nullen behalten, damit Seriennummern unverändert dargestellt und gesucht werden können.
9. Als Mitarbeiter möchte ich Mengen ohne Seriennummer erfassen, damit nicht-serielle Hardware wie Antennenstative verwaltet werden kann.
10. Als Mitarbeiter möchte ich einen Empfänger mit E-Mail und Telefon erfassen, damit Rückgaben operativ nachverfolgt werden können.
11. Als Mitarbeiter möchte ich Ausgabedatum, erwartetes Rückgabedatum, Rückgabedatum und Notiz pflegen, damit jeder Vorgang zeitlich und sachlich nachvollziehbar ist.
12. Als Mitarbeiter möchte ich die Status Offen, Mail senden, Benachrichtigt, Retourniert und Abgeschlossen verwenden, damit der operative Rückgabeprozess eindeutig bleibt.
13. Als Mitarbeiter möchte ich Retourniert und Abgeschlossen getrennt führen, damit physische Rückgabe und anderweitige Klärung nicht verwechselt werden.
14. Als Mitarbeiter möchte ich einen Vorgang als retourniert markieren, damit er nicht mehr als überfällig gilt.
15. Als Mitarbeiter möchte ich einen Vorgang abschließen, damit verlorene, verrechnete oder manuell geklärte Fälle aus dem offenen Arbeitsbestand verschwinden.
16. Als Mitarbeiter möchte ich überfällige Vorgänge erkennen, damit Rückgaben rechtzeitig nachverfolgt werden.
17. Als Mitarbeiter möchte ich im Event kompakte Kennzahlen zu offenen und überfälligen Vorgängen sehen, damit ich den Arbeitsaufwand sofort einschätzen kann.
18. Als Mitarbeiter möchte ich alle Hardware-Vorgänge eventübergreifend sehen, damit ich zentrale Rückgaben koordinieren kann.
19. Als Mitarbeiter möchte ich abgeschlossene und retournierte Vorgänge standardmäßig ausblenden und bei Bedarf einblenden, damit die zentrale Liste operativ fokussiert bleibt.
20. Als Mitarbeiter möchte ich nach Event, Status, Ausgabeart, Objekt und Überfälligkeit filtern, damit ich relevante Fälle schnell eingrenzen kann.
21. Als Mitarbeiter möchte ich nach Empfängername, E-Mail und Objektnummer suchen, damit ich Vorgänge auch ohne genaue Filterkenntnis finde.
22. Als Mitarbeiter möchte ich vom Eventnamen in der zentralen Liste direkt zum Event gelangen, damit ich dort den Vorgang weiterbearbeiten kann.
23. Als n8n-Automation möchte ich Vorgänge mit Status Mail senden abrufen und auf Benachrichtigt setzen können, damit Mailversand später außerhalb der Base automatisiert werden kann.
24. Als Product Owner möchte ich noch kein vollständiges Inventarsystem einführen, damit V1 auf operative Event-Rückgaben begrenzt bleibt.

## Implementation Decisions

- Ein frameworkfreies Hardware-Workspace-Modul in `@t2w/domain` kapselt Eingabevalidierung, Range-Berechnung, Darstellung strukturierter Nummern, Statusübergänge und die Ableitung von Überfälligkeit.
- Die Datenbank erhält ein Event-verknüpftes Hardware-Modell mit Identität, Empfänger, Ausgabeart, Objekt, strukturiertem Nummernmodus, Einzelnummer bzw. Range-Parametern, Menge, Status, Kontaktdaten, Datumsfeldern, Notiz sowie Erstellungs-/Änderungszeitpunkten.
- V1 unterstützt Einzelgerät, eine eindeutige Range und Menge ohne Seriennummer. Mehrere Nummern/Ranges pro Ausgabe bleiben als spätere Erweiterung möglich, werden aber nicht in V1 umgesetzt.
- Jeder Hardware-Vorgang repräsentiert genau eine Position: ein Einzelgerät, eine eindeutige Range oder eine nicht-serielle Menge.
- Range-Parameter umfassen Prefix, numerische Grenzen und Padding. Führende Nullen werden aus den strukturierten Werten rekonstruiert; die Anzahl ist bei eindeutigen Ranges abgeleitet.
- Ausgabearten sind Teilnehmer, Verleih und Sonstige. Rental wird nicht als Status verwendet.
- Statuswerte werden als stabile API-/Persistenzwerte mit deutschen UI-Bezeichnungen geführt: `OPEN`, `MAIL_SEND`, `NOTIFIED`, `RETURNED`, `COMPLETED`.
- Ein Vorgang ist überfällig, wenn das Rückgabedatum vor dem aktuellen Datum liegt und der Status weder Retourniert noch Abgeschlossen ist.
- Der Event-Service erweitert bestehende Event-Record-Retrieval-, Mutation-, Prisma- und Controller-Muster. Event-Hardware wird über den Event-Datensatz geladen; die zentrale Abfrage liefert Hardware mit Eventcode und Eventname.
- Die API bietet CRUD für Event-Hardware, Statusänderungen bzw. Rückgabe/Abschluss sowie eine zentrale, filter- und suchbare Liste. Die Filterung bleibt im Workspace/enthaltenden Modul; HTTP und Prisma bleiben Adapter.
- Bestehende Event-Service-Berechtigungen gelten unverändert: eingeloggte Mitarbeiter dürfen verwalten; eine neue Rollenmatrix gehört nicht zu V1.
- Erstellen, Ändern, Löschen und Statuswechsel werden über das bestehende AuditLog-Muster protokolliert.
- Die zentrale API unterstützt Pagination und explizite Filterparameter. Standardmäßig werden `RETURNED` und `COMPLETED` ausgeblendet und aktive Fälle nach operativer Relevanz bzw. Fälligkeit sortiert.
- Physisches Löschen ist nur für offene bzw. aktive Korrekturfälle zulässig. Retourniert oder Abgeschlossen markierte Vorgänge sind löschgeschützt und bleiben als Historie erhalten.
- Es erfolgt kein automatischer Import der bestehenden ClickUp-Liste in V1.
- Überfälligkeit wird anhand des lokalen Kalendertags in der bestehenden Europe/Vienna-Projektlokalisierung bestimmt, nicht anhand einer exakten Uhrzeit.
- Die Event-Detailansicht erhält einen Hardware-Tab. Die zentrale Hardware-Seite erhält einen Hauptnavigationspunkt und verwendet vorhandene Tabellen-, Badge-, Datum-, Filter- und Link-Komponenten.
- Kennzahlen werden aus derselben Abfrage-/Projektion ableitbar gemacht und umfassen mindestens offen, überfällig, benachrichtigt und Verleihvorgänge.
- Es wird keine Mail- oder n8n-Logik in der UI implementiert. Statuswerte und API-Filter werden so gestaltet, dass n8n Vorgänge mit `MAIL_SEND` lesen und auf `NOTIFIED` aktualisieren kann.
- Es werden keine Lager-, Standort-, Wartungs-, Einkaufs-, Reparatur-, automatischen Inventargenerierungs- oder vollständigen Historienfunktionen umgesetzt.
- Bestehende lokale Änderungen im Repository dürfen nicht überschrieben werden; neue Migrationen und Wiki-Einträge müssen sich in die vorhandene Historie einfügen.

## Testing Decisions

- Domain-Tests prüfen ausschließlich beobachtbares Verhalten über die Hardware-Workspace-Schnittstelle: Einzelgerät, Range-Anzahl, Padding, serielle und nicht-serielle Mengen, Statusübergänge und Überfälligkeit.
- Service-/API-Tests prüfen CRUD, Event-Verknüpfung, Filter, Suche, zentrale Aggregation und stabile Status-/Nummerndarstellung über austauschbare Persistenz- bzw. Prisma-Adapter.
- Browser-E2E prüft den vollständigen Event-Hardware-Workflow einschließlich Anlegen, sichtbarer Tabelle, Statusänderung, Retourniert-/Abgeschlossen-Semantik und Persistenz nach Reload, sofern der bestehende Testadapter dies ermöglicht.
- Ein zweiter Browser-E2E-Workflow prüft die zentrale Hardware-Seite mit Vorgängen mehrerer Events, Standardfilter, Filterkombinationen, Suche und funktionierendem Event-Link.
- Bestehende E2E-Konventionen für gemockte `/api/v1`-Routen, Event-Detailnavigation und sichtbare Tabellen werden wiederverwendet.
- Typecheck, Lint, Domain-/Service-Tests und relevante Playwright-Tests müssen erfolgreich laufen.
- Tests prüfen zusätzlich Berechtigungsgrenzen, Audit-Einträge, Pagination, Standardfilter, Löschschutz und die lokale Kalendertag-Semantik.

## Out of Scope

- Automatischer Mailversand, n8n-Workflow-Ausführung oder direkte Kommunikationslogik.
- Vollständiges Inventarsystem mit Lagerbestand, Standort, Wartung, Einkauf, Reparaturen, Gerätehistorie oder automatischer Einzelinventargenerierung.
- Freie Auswahl mehrerer einzelner Geräten und Ranges innerhalb eines einzigen V1-Vorgangs.
- Automatischer Import oder Datenbereinigung der bestehenden ClickUp-Liste.
- Austausch der bestehenden Event-Domain durch ein isoliertes Hardware-Fremdmodul.

## Further Notes

- Hardware ist ein Teil der operativen Eventverwaltung und soll langfristig neben Stammdaten, Vorbereitung, Startnummerndruck, Ablauf, Durchführung und Nachbereitung bestehen.
- Die ClickUp-Liste dient nur als funktionale Referenz für Kompaktheit und operative Lesbarkeit; das bestehende T2W-Design-System bleibt maßgeblich.
- Vor der Implementierung sind konkrete Module und bestehende Patterns nochmals anhand der aktuellen Codebasis zu verifizieren. Relevante neue Entscheidungen, Migrationen, API-Verträge und Risiken werden anschließend im Wiki und Log dokumentiert.
- Zentrale Hardware-Ansicht behandelt verwaiste Datensätze mit `event = null` defensiv und zeigt sie ohne Event-Link als „Kein Event zugeordnet“; Browser-Regressionstest ergänzt.
- Stand 2026-09-10: Die zentrale Übersicht hebt Überfälligkeit als eigene Kennzahl und direkt am Status/Datum hervor. Filter sind beschriftet, zeigen die Anzahl aktiver Vorgänge, lassen sich gesammelt zurücksetzen und die Tabelle besitzt eine verständliche Leeransicht. Datumswerte werden in der deutschen Oberfläche lokal formatiert. Quelle: `src/routes/hardware.tsx`, `tests/e2e/hardware.spec.ts`.
