# Maintenance Log

## 2026-09-22

- Die übrigen Listen gegen die Artboards abgeglichen. **Behoben:** Übersicht, Hardware und Auszahlungen trugen ein eigenes Suchfeld, das in keinem Artboard steht — die Suche liegt einmal oben in der Kopfzeile. Hardware und Auszahlungen nehmen eine Frage jetzt als `?q=` entgegen und zeigen sie als abwählbaren Chip (Hardware ist Ziel der globalen Suche); die Übersicht filtert über ihre Chips. Die Übersicht hat zusätzlich den Knopf „Kalender" neben „Event anlegen" bekommen, wie im Entwurf. **Offen und bewusst nicht gebaut**, weil es Funktion statt Gestaltung wäre: Hardware fehlen die Statuschips mit Anzahl (Alle/Offen/Überfällig/Zurück), der Filter „Empfänger" und der Knopf „Objekt anlegen"; die Kennzahlkacheln heißen anders als im Entwurf. Auszahlungen zeigt eine Kachel „Summe gefiltert" statt der vier Kacheln des Entwurfs. Einstellungen hat keine Reiterleiste auf der Seite — die fünf Bereiche hängen im Untermenü der Seitenleiste; der Entwurf zeigt beides. **Widerspruch festgehalten:** die [PM-Grundlage](concepts/project-management-design.md) nennt für die Gesamtübersicht der Aufgaben eine Suche in der Chipleiste, das Artboard zeigt dort keine; umgesetzt ist der Stand ohne Suche, wie auf den übrigen Listen.

- Nachgezogene Tests: die Browsertests von Hardware und Auszahlungen gehen den Weg über `?q=`; der Sprachtest prüft die übersetzte Brotkrume statt der entfallenen Kartenüberschrift „Basic data"; der Tabellenkopftest erwartet jetzt 12 px in Normalschreibung statt 10 px in Versalien — so steht es seit dem Artboard-Abgleich in [`styles.css`](../src/styles.css).

- Das Artboard „Kunden & Kontakte" auf den Stand der Anwendung gebracht, nachdem drei Punkte des Entwurfs auf Nutzerentscheidung vom 22.09.2026 **nicht** umgesetzt werden: die personenbezogene Rollen-Chipgruppe (Rollen hängen am Event, nicht an der Person), die Kopfzeile „zuletzt geändert … von …" (der Kontakt führt keinen Änderungszeitstempel) und „Archivieren" in der Fußzeile (kein Archivkennzeichen an Person oder Kunde). Der Entwurf zeigt jetzt stattdessen, was die Anwendung zeigt: Person mit beiden Telefonnummern, Anschrift und Notiz als eigene Abschnitte (beide fehlten im Entwurf, die Felder gibt es aber und sie bleiben bearbeitbar), Events mit Eventcode und Rollenchip statt Datum und Statuspunkt, und „Kontakt löschen" statt „Archivieren". „Importieren" im Seitenkopf ist auch aus dem Entwurf entfernt — gestrichen am 21.09. Damit stimmen Entwurf und Oberfläche auf dieser Seite wieder überein.

- Drei Nachbesserungen an Kunden & Kontakte. **Fehler behoben:** ein Personentreffer der globalen Suche führte ins Leere — die Seite las den Parameter `?q=` nie, und seit dem Wegfall des eigenen Suchfelds tat sich beim Klick gar nichts mehr. Sie liest ihn jetzt, zeigt die Frage als abwählbaren Chip und lässt eine leere Frage aus der Adresse fallen. Regression: [`contacts-filters.spec.ts`](../tests/e2e/contacts-filters.spec.ts). **Datensatz näher am Artboard:** „Funktion" heißt im Datensatz jetzt „Position" und steht unter Zugehörigkeit neben dem Kunden statt bei den Personendaten, wie es der Entwurf zeichnet. **Kein Logo im Tabellenkopf:** die beiden Browsertests erwarteten noch das TIME2WIN-Zeichen in der T2W-Spalte; der Code zeigt seit dem 22.09. Klartext, und dabei bleibt es — ein Markenzeichen als Spaltenkopf lässt sich weder sortieren noch vorlesen. Die Tests prüfen jetzt den Text und dass im Tabellenkopf überhaupt kein Bild steht. Das Zeichen bleibt, wo es hingehört: in der Seitenleiste und als Favicon.

- Kunden & Kontakte gegen das Artboard gebracht. Liste: die drei Reiter tragen jetzt die Segmentleiste mit Unterstrich statt Pillen, das eigene Suchfeld ist entfallen (die Suche steht einmal oben in der Kopfzeile; eine offene Frage aus der globalen Suche bleibt als abwählbarer Chip sichtbar), und die Namensspalte zeigt Initialen und darunter die Organisation — bei über 800 Kontakten sagt der Name allein zu wenig. Datensatz: Kontakt und Kunde sind in Abschnitte mit Versalüberschriften gegliedert (Person, Anschrift, Zugehörigkeit, Notiz, Events beziehungsweise Organisation, Anschrift, Bankverbindung, Kontakte, Events), die Beschriftung sitzt über dem Feld, Events stehen als anklickbare Zeile mit Rollenchips und Pfeil. **Gespeichert wird der Datensatz jetzt als Ganzes** — „Ungespeicherte Änderungen", „Abbrechen", „Änderungen speichern" wie im Eventdetail; vorher sicherte jedes Feld beim Verlassen für sich, und es gab nichts zu verwerfen. Das Lösen einer Zuordnung sitzt am Chip selbst statt in einem eigenen Block unter den Events. Nicht übernommen: die personenbezogene Rollen-Chipgruppe (Rollen hängen am Event, nicht an der Person), „Archivieren" (kein Archivkennzeichen an Person oder Kunde) und „Importieren" (bereits am 21.09. gestrichen). Quelle: [Entwurf](https://claude.ai/artifact/LQBFcGU5npsM9LZuasSrUK), Artboard „Kunden & Kontakte".

- **Die Notiz gilt je Detailreiter, nicht je Event.** Der erste Umbau hatte eine gemeinsame Eventnotiz auf Stammdaten, Anmeldung, Finanz und Kontakte gestellt; auf Nutzerentscheidung vom 22.09.2026 führt jeder Reiter wieder seine eigene: Stammdatennotiz, Anmeldenotiz, Finanznotiz, Kontaktnotiz. Für die Anmeldung gab es keine Spalte — neu als `registrationNotes` samt Migration [`0039_registration_notes`](../services/event-service/prisma/migrations/0039_registration_notes/migration.sql) durch Schema, Mutationstyp, Controller-DTO, Anlege-Adapter und die Frontend-Abbildung als `anmeldungNotizen` gezogen. Die Artboards tragen die neuen Titel.

- Das Suchfeld der Veranstaltungsliste ist entfallen: das Artboard führt die Suche nur einmal, oben in der Kopfzeile über alle Module. Der Suchbegriff wirkt weiter, wenn man über die globale Suche mit `?q=` herkommt — dann steht er als abwählbarer Chip in der Filterleiste, sonst wäre nicht zu sehen, warum die Liste kurz ist, und die Frage wäre nicht mehr loszuwerden. Quelle: Nutzerentscheidung vom 22.09.2026.

- Die acht Reiter der Eventdetailseite nach dem freigegebenen Artboard umgebaut und gegen [base.time2win.cloud](https://base.time2win.cloud) geprüft. Aus wenigen sehr breiten Karten wurden kleinere Karten links und eine 330-px-Schiene rechts; das Gerüst dafür steht einmal in [`DetailKarte.tsx`](../src/components/t2w/DetailKarte.tsx) statt achtmal im Reiter. Die Reiterleiste trägt jetzt den Unterstrich-Stil (neue Variante in [`tabs.tsx`](../src/components/ui/tabs.tsx)), Status und Aktionen stehen oben neben dem Titel, die Beschriftung sitzt über dem Feld, Leistungen sind Chips zum An- und Abwählen, Archivieren liegt beim Löschen im Gefahrenbereich. **Die Notiz gilt ab jetzt je Event** und steht auf Stammdaten, Anmeldung, Finanz und Kontakte in der Schiene; die eigenen Finanz- und Kontaktnotizen entfallen, vorhandener Text bleibt als „Frühere …notiz" lesbar, damit nichts unerreichbar in der Datenbank liegt. Aus dem Entwurf **nicht** übernommen, weil es dafür keine Daten und keine Dienstschnittstelle gibt: Bundesland und Treffpunkt Team, Nachmeldung und Abgleichverlauf, Nenngeld und „Leistungen und Konditionen", der aus SharePoint gespiegelte Ordnerinhalt, Kennzahlen und Ausgabeprotokoll der Hardware. **Widerspruch festgehalten:** das Artboard zeigt auf dem Reiter Projektmanagement eine dritte Ansicht „Abläufe" sowie Status- und Personenfilter; die [PM-Designgrundlage](concepts/project-management-design.md) nennt zwei Ansichten und verortet diese Filter in der Gesamtübersicht — umgesetzt ist die dokumentierte Grundlage. Quelle: [Entwurf](https://claude.ai/artifact/LQBFcGU5npsM9LZuasSrUK), Commits `8739d85f` und `739e75d0`.

- Beim Abgleich auf dem Produktivsystem gefunden und behoben: das Aufgaben-Fortschrittsband sprengte in der 330-px-Schiene seine Karte. [`TaskSummary`](../src/components/t2w/TaskSummary.tsx) hat dafür eine schmale Fassung ohne eigenen Rahmen bekommen; die breite Fassung im Reiter Projektmanagement bleibt unverändert.

- Designgrundlage als [DESIGN.md](../DESIGN.md) im Wurzelverzeichnis abgelegt und aus [AGENTS.md](../AGENTS.md) verlinkt, damit ein Agent ohne Zugriff auf das private Design-Canvas nach denselben Regeln baut. Die Datei ist aus den 27 Artboards des Canvas „TIME2WIN Seitenentwürfe" geschrieben: Farben, Schrift, Raster, Seitengerüst, Muster je Baustein, Mobil, Barrierefreiheit, dazu die Zuordnung Artboard-Muster → bereits vorhandene Komponente und die bewussten Abweichungen. Quelle: [Entwurf](https://claude.ai/artifact/LQBFcGU5npsM9LZuasSrUK).

- Breite der Seitenleiste auf die Artboardwerte gebracht: 248 px in der Grundstellung statt `w-60` (240 px), 68 px als schmale Symbolleiste statt `w-16` (64 px). Die 64 px waren zu eng — die Symbolfelder sind 44 px breit und standen bei 2 × 12 px Rand über die Leiste hinaus. Die beiden Werte liegen jetzt als `SIDEBAR_BREITE` und `SIDEBAR_ABSTAND` in [`AppSidebar.tsx`](../src/components/t2w/AppSidebar.tsx); vorher trugen Leiste und linker Abstand der Inhaltsfläche ihre Zahl getrennt in zwei Dateien und stimmten nur zufällig überein. Regression: [`tests/e2e/sidebar-width.spec.ts`](../tests/e2e/sidebar-width.spec.ts) misst Leiste und Inhaltskante in beiden Zuständen.

- `src/components/ui/sidebar.tsx` gelöscht. Der shadcn-Baukasten für Seitenleisten lag seit dem Projektstart im Repository, wurde aber nie importiert — die eigene Leiste in `AppSidebar.tsx` ist von Hand gebaut. Die Datei war irreführend: ihre Konstanten `SIDEBAR_WIDTH`/`SIDEBAR_WIDTH_ICON` (16 rem / 3 rem) sahen wie die geltenden Breiten aus, ohne je zu wirken. Ohne Verweise im Code; Typprüfung und Build laufen. Mitgegangen sind die beiden Dinge, die nur sie gebraucht haben: `src/hooks/use-mobile.tsx` (einziger Aufrufer) und die acht `--sidebar-*`-Farbwerte in [`src/styles.css`](../src/styles.css) samt ihren `@theme inline`-Zuordnungen. Die Navigationsfarben heißen `--nav-*` und sind davon unberührt. Nachgeprüft mit Typprüfung, Build und den Browsertests zu Navigation, Kontakten, Aufgaben und Auszahlungen.

## 2026-09-21

- Oberflaeche gegen die freigegebenen Artboards abgeglichen: 33 Abweichungen erhoben, 30 behoben, 3 auf Nutzerentscheidung gestrichen. Behoben unter anderem: der Kalender trug als einzige Seite keinen Seitenkopf; die Symbolbibliothek war serverseitig fertig und in der Oberflaeche nicht erreichbar; die Auswahllistenwerte hatten drei Bedienwege statt des vereinbarten Sheets; die Navigation lag in einer Liste statt in den drei Gruppen; die Kennzahlkacheln quetschten sich auf dem Telefon aus dem Bild. Gestrichen ohne Umsetzung, weil es dafuer keine Dienstschnittstelle gibt und keine gebaut werden soll: „Importieren" bei den Kontakten, „Neue Aufgabe" mit Eventbezug auf der Aufgabenseite, „Sammelexport" der Auszahlungen. Quellen: [Entwurf](https://claude.ai/artifact/LQBFcGU5npsM9LZuasSrUK), [Abgleichsliste](https://claude.ai/artifact/7BktXXoJ5opMTBPUJR5R3Y), Commits `0856b54e` bis `5f87f904`.

- Produktionsmigrationen `0036_selection_list_versioning`, `0037_icon_library` und `0038_selection_list_presentation_data` auf der PostgreSQL-Datenbank `t2w_events` angewendet. Sie liefen nicht von Hand, sondern im Deployschritt des Hostinger-Workflows, der bei jedem Push auf `main` `prisma migrate deploy` ausführt; Prisma meldete die drei Namen unter `The following migration(s) have been applied`, der Statuslauf danach `Database schema is up to date`. Inhalt: optimistische Sperre (`version`) für alle sechs Auswahllistentabellen, die Symbolbibliothek `IconAsset` samt Fremdschlüssel auf `User`, und die einmalige Übernahme der bisher im Frontend fest verdrahteten Symbol-/Farbzuordnung in die Spalten samt Abbildung der zwanzig alten Farbnamen auf die acht geprüften. Ohne `0038` verlören Services und Nachrichtenarten ihre Darstellung, weil die namensbasierte Ersatztabelle in `ServiceBadge.tsx` entfallen ist. Quellen: [Hostinger-Deploy #35644988052](https://github.com/AndiT2W/t2w-base/actions/runs/35644988052), [0036](../services/event-service/prisma/migrations/0036_selection_list_versioning/migration.sql), [0037](../services/event-service/prisma/migrations/0037_icon_library/migration.sql), [0038](../services/event-service/prisma/migrations/0038_selection_list_presentation_data/migration.sql).

- Produktionsmigration `0035_hardware_object_presentation` auf der PostgreSQL-Datenbank `t2w_events` angewendet. Prisma meldete `All migrations have been successfully applied`; der anschließende Statuslauf bestätigte `Database schema is up to date`. Die Migration ergänzt optionale `icon`- und `color`-Spalten für `HardwareObjectOption`. Quelle: [Hostinger-Deploy #35641057897](https://github.com/AndiT2W/t2w-base/actions/runs/35641057897), [Migration SQL](../services/event-service/prisma/migrations/0035_hardware_object_presentation/migration.sql).

## 2026-09-19

- Planungsarchitektur vertieft: Jede Aufgabenintention liefert nun einen aktuellen Planungsschnappschuss mit stabiler `affectedTaskId`; gleichnamige Aufgaben können damit nach einer Anlage nicht mehr falsch ausgewählt werden. Der Event-Service erzeugt die globale Aufgabenprojektion mit Eventkontext, Blockadegründen und Kategorieblöcken; die Route filtert nur noch diese Projektion. Anhänge durchlaufen den Task-Interaction-Workspace, während das Aufgabenpanel bei nativer Dateiauswahl und dem Speichern des Downloads bleibt. `ProjectManagementService` ist jetzt Fassade für Planung, Kategorienkatalog sowie Aufgabenverlauf/Anhänge. Eine Browser-Regression deckt die Anlage zweier gleichnamiger globaler Aufgaben mit Reload ab; Workspace- und Service-Regressionen sichern Anhänge, Ergebnisidentität und die Projektion. Quellen: Nutzerentscheidung vom 2026-09-19, [Planungskonzept](concepts/task-planning-and-table-deepening-2026-09-15.md), [PM-Service](../services/event-service/src/project-management.service.ts), [Workspace](../src/lib/t2w/task-interaction-workspace.ts), [Browser-Regression](../tests/pm-e2e/project-management.spec.ts).

## 2026-09-18

- Die von Claude am 17.09.2026 überarbeitete PM-Oberfläche auf Nutzerwunsch als [verbindliche Designgrundlage](concepts/project-management-design.md) übernommen. Code und laufende Desktopansicht für Kategorien, Ablaufketten, Aufgabenpanel, Event-Zeitachse und globale Dringlichkeitsliste abgeglichen. `AGENTS.md` verweist vor PM-UI-Änderungen auf die Grundlage und verlangt deren Weiterpflege. Wiki-Einstiege, PM v4, Tabellenstandard und frühere Übersichtsentscheidung konsistent fortgeschrieben; Historie als überholt gekennzeichnet. Vier gezielte Testsuiten mit 50 Tests bestanden. Alte Browser-Erwartungen und aktuelle Umsetzungslücken sind im [Quellnachweis](sources/2026-09-18-claude-pm-design.md) dokumentiert; keine UI- oder Fachdatenänderung.

- Issue #49 um externe Veranstalterkonten erweitert: Ein Konto ist genau einem Veranstalter-Stammsatz zugeordnet, erhält Zugriff ausschließlich über persönlich zugewiesene Eventaufgaben und darf dort kommentieren sowie Dateien hochladen. Aufgabenstatus und andere Felder bleiben schreibgeschützt; fremde, globale und nicht zugewiesene Aufgaben sowie alle internen Module sind gesperrt. Neuzuweisung oder Deaktivierung entzieht den Zugriff sofort, Beiträge bleiben erhalten. Quelle: Nutzerkonversation vom 2026-09-18, [Spezifikation](tasks/system-users-spec.md), [PM v4](tasks/project-management-spec-v4.md) und [Entscheidung](decisions/2026-09-09-systembenutzer-und-berechtigungen.md).

- Issue #49 und das Mehrbenutzermodell präzisiert: Finanzzugriff ist keine dritte Rolle, sondern die benutzerbezogene Berechtigung `Finanzen sehen`. Admins besitzen sie immer; normale Benutzer standardmäßig nicht. Ohne Berechtigung sind Finanznavigation, direkte Routen, API-Endpunkte, Dokumente, Beträge, Kennzahlen und Exporte für Angebote, Rechnungen, Gutschriften, Zahlungen und Auszahlungen gesperrt. Quelle: Nutzerkonversation vom 2026-09-18, [Spezifikation](tasks/system-users-spec.md) und [Entscheidung](decisions/2026-09-09-systembenutzer-und-berechtigungen.md).

## 2026-09-15

- Nutzerwunsch umgesetzt: Sportart und jeder Service erscheinen in den Eventtabellen mit demselben konfigurierten Badge wie in den Event-Stammdaten. Der Browser-Regressionstest prüft die Badges samt Icons.

- Nutzerwunsch umgesetzt: Die Eventtabellen in Übersicht und Veranstaltungen zeigen Sportart und Services in getrennten, sortierbaren Spalten; mehrere Services teilen sich eine Zelle. Browser-Regression prüft getrennte Spalten und Inhalte. Quellen: [Übersicht](../../src/routes/index.tsx), [Veranstaltungen](../../src/routes/veranstaltungen.tsx), [E2E-Test](../../tests/e2e/event-management.spec.ts).

- Task-Planungsarchitektur vertieft: Der Interaction-Workspace kapselt Erstellen, Ändern, Voraussetzungen, Kommentare und Aktualisierung hinter Intent-Methoden. Die HTTP-Adapter kapseln Versionen und Persistenzpfade. `TaskDetailSheet` bezieht seine Interaktion über einen kompakten Planungskontext; die globale Ansicht verwendet nur noch den serverautoritativen Task-Adapter. Eine Workspace-Regression verhindert, dass verspätete Historie nach schnellem Auswahlwechsel oder Schließen sichtbar wird. Fokussierter Workspace-Test, ESLint und Produktionsbuild bestanden; der PM-Browsertest benötigt weiterhin `PM_TEST_DATABASE_URL`. Quellen: [Workspace](../../src/lib/t2w/task-interaction-workspace.ts), [Task-Detail](../../src/components/t2w/TaskDetailSheet.tsx), [Globaler Adapter](../../src/lib/t2w/project-management.ts), [Konzept](concepts/task-planning-and-table-deepening-2026-09-15.md).

- Nutzerentscheidung umgesetzt: Die globale Aufgabenübersicht verwendet nun die kontrastreiche Kartenansicht. Dunkle Event-Köpfe trennen Planungsbereiche; Kategorien kombinieren Akzentleiste, Lucide-Icon, nächsten Schritt, Zählwerte und einklappbaren Workflow. Dringlichkeit bleibt über getrennte beschriftete Status-Tags erkennbar. Filter, Detail-Sheet und Gantt bleiben erhalten. Der echte PM-Browserlauf gegen isolierte PostgreSQL-Testdatenbank bestand mit 5/5 Tests. Quellen: [Entscheidung](decisions/2026-09-15-kontrastorientierte-aufgabenuebersicht.md), [Aufgabenroute](../../src/routes/aufgaben.tsx), [PM-Browser-Regression](../../tests/pm-e2e/project-management.spec.ts).

## 2026-09-14

- Gemeinsamer Tabellenstandard eingeführt: `DataTable` definiert die kompakte Desktopdichte (30/34 px), Status-Tags und sichtbaren Tastaturfokus; die zentralen Event-, Hardware- und Auszahlungstabellen verwenden ihn. Benutzerpräferenzen für Sichtbarkeit, Sortierung und Reihenfolge werden über die geschützte `UserTablePreference`-Haltung synchronisiert. Unit- und Browser-Regression prüfen sichere Wiederherstellung bzw. Rückspeicherung. Quellen: [Datentabellen-Konzept](concepts/shared-compact-data-tables.md), [ADR-0003](../../docs/adr/0003-shared-compact-data-tables.md), [E2E-Test](../../tests/e2e/table-preferences.spec.ts).

- Der Hardware-E2E-Test prüft beim Inline-Ändern der Objektnummer nun die passende PATCH-Anfrage statt pauschal der zuletzt eingegangenen Anfrage. Ein durch den Fokuswechsel ausgelöster, unveränderter Mengen-Request konnte die letzte Anfrage überlagern und den GitHub-Deploy fälschlich fehlschlagen lassen. Quelle: [Hardware-E2E-Test](../../tests/e2e/hardware.spec.ts), [Deploy-Workflow](../../.github/workflows/deploy-hostinger.yml).

- Ablauf-Badges trennen nun echte Abhängigkeitsgruppen von unabhängigen Aufgaben. Dadurch wird beispielsweise `Startnummerndesign eingerichtet → Startnummern gedruckt` direkt gezeigt, während `Startnummernzuteilung` nicht mehr als scheinbarer Vorgänger erscheint. Unit- und Browser-Regression ergänzt; der Browserlauf benötigt weiterhin `PM_TEST_DATABASE_URL`. Quellen: [Badge-Komponente](../../src/components/t2w/TaskFlowBadges.tsx), [Ablaufprojektion](../../src/lib/t2w/task-flow-display.ts), [PM-Browser-Regression](../../tests/pm-e2e/project-management.spec.ts).

- `PmTask` als einzige Aufgabenhaltung für Event- und globale Planung bestätigt. Die Migration `0028_canonical_task_projection` entfernt den alten `EventTask`-Speicher ohne Datenübernahme; Event-Schnappschüsse liefern stattdessen offene und überfällige Aufgaben als Readiness-Projektion. Abhängigkeiten bleiben innerhalb eines Planungsbereichs. Siehe [ADR-0002](../../docs/adr/0002-canonical-event-and-global-tasks.md), [PM-Domain](../../packages/domain/src/project-management.ts) und [PM-Browser-Regression](../../tests/pm-e2e/project-management.spec.ts).

## 2026-09-09

- Neues vorgeschlagenes Berechtigungsmodell aufgenommen: Systembenutzer mit `Admin`/`User`, serverseitiger Autorisierung, Einladungsworkflow und Deaktivierung statt Löschung; getrennt von fachlichen Eventrollen.

- ClickUp-Liste `AUSZAHLUNGEN` geprüft: 1.013 Datensätze, Felder Veranstaltung, Status, Auszahlungsbetrag und Transaktionsbestätigung sowie Statusgruppen `erstellt`, `gesendet`, `ausbezahlt`; n8n-Versandstatus `versenden` dokumentiert.
- Arbeitsgrundlage für monatliche Nenngeld-Auszahlungen erstellt: Event-zu-Auszahlung 1:n, globale fortlaufende Nummer, Empfängersnapshot, getrennte Mail-/Zahlungsstatus, zentrale Übersicht und idempotenter n8n-Versand. Siehe [Auszahlungs-Spezifikation](tasks/event-payouts-spec.md).

## 2026-09-07

- Events besitzen nun eine persistente Mehrfachzuordnung zu Services. Die zentral gepflegte Liste unter **Einstellungen → Auswahllisten** startet mit UHF, Active, Streaming, Foto, Video (iRewind), GPS, Virtuell, Anmeldung (only), App und Jörg. Inaktive Werte bleiben bei bereits zugeordneten Events sichtbar. Evidenz: [Event-Service-Migration](../../services/event-service/prisma/migrations/0017_event_services/migration.sql), [Anforderung](sources/2026-09-07-user-event-services.md).

## 2026-08-28

- Nach Abgleich mit dem implementierten Code wurden die GitHub-Issues #23 (persistente Eventdatenquelle), #25 (Outlook-Graph-Ordner), #26 (Deutsch/Englisch) und #31 (scrollbare Kalender- und Gantt-Zeiträume) als erledigt geschlossen. #21/#22 bleiben wegen der noch fehlenden TIME2WIN-Synchronisierung offen; #27/#30 enthalten noch nicht vollständig umgesetzte CRM-/Event-Flow-Anforderungen.

## 2026-08-27

- Event workspace in `@t2w/domain` vertieft: Eine gebundene Editing Session besitzt nun Draft, Validierung, Versionskonflikte und alle Detailkommandos. Persistierte Event-Snapshots werden automatisch in Collection und Session übernommen; die Event-Route koordiniert kein manuelles `accept` mehr nach Kontakt-, Aufgaben-, Datei-, Aktivitäts- oder Outlook-Kommandos.
- Architekturvertiefung begonnen: Repository auf npm Workspaces umgestellt und `@t2w/domain` als gemeinsam gebautes, frameworkfreies Domain-Paket eingeführt. CRM-Zustandsübergänge sowie Lösch-/Referenzregeln liegen dort; React, HTTP, Nest, LocalStorage und Prisma bleiben Adapter. CI und Event-Service-Docker-Build nutzen den kanonischen Root-Lockfile.
- Outlook-Ordnersynchronisierung speichert wieder den vollständigen lesbaren Pfad `Jahresordner/Quartal/Eventcode` statt nur des Anzeigenamens des Event-Unterordners. Eine Backend-Regression sichert die Persistierung des kanonischen Pfads.
- Outlook-Ordnernavigation verwendet nun eine mailbox-spezifische Outlook-Web-URL (`/mail/{Mailbox}/{Ordner-ID}`), nicht mehr den nicht auflösbaren generischen `deeplink/folder`-Fallback.

## 2026-08-25

- Issue #15 aktualisiert: Die zentrale Eventverwaltung, persistente Event-Service-Datenquelle, Event-Workspace-Grundfunktionen sowie Outlook-/SharePoint- und CRM-Anbindungen sind als erledigt bzw. vorhanden dokumentiert. Offen bleiben der dedizierte TIME2WIN-Reiter mit API-Daten, Teilnehmer-Synchronisierung, Rollenverwaltung sowie mutierbare Aufgaben/Aktivitäten und deren Browser-E2E-Abdeckung.
- Issue #20 aktualisiert: Die Eventdetailseite wird nicht mehr als Neubau beschrieben, sondern als Ausbau der bereits persistenten Event-Workspace-UI. Vorhandene Stammdaten-, Outlook-/SharePoint-, Tab- und Mehrsprachigkeitsfunktionen sind dokumentiert; offen bleiben insbesondere TIME2WIN-Reiter, Rollenverwaltung, mutierbare Aufgaben/Aktivitäten sowie Browser-E2E-Abdeckung.
- Die Billing-Tickets #2, #3 und #14 wurden bewusst zurückgestellt und mit dem GitHub-Label `deferred` aus der aktuellen Umsetzungspriorität genommen. Sie bleiben für eine spätere Billing-/Angebotsphase offen.

## 2026-08-23

- Published GitHub issue #32 specifying a central containerized Codex gateway with a stable internal task interface, a first `mail-summary` workflow, shared ChatGPT Plus authentication, strict security limits, and regression-test requirements.
- CRM-Seam mit zwei echten Adaptern vervollständigt: Event-Service/HTTP bleibt Standard, `VITE_CRM_ADAPTER=local` aktiviert explizit einen persistenten LocalStorage-Demo-Adapter. Beide implementieren dasselbe Person/Kunde-Interface und dieselben Beziehungsinvarianten.
- CRM-Modul auf ausschließliche Event-Service-Persistenz umgestellt; Demo-Daten und `localStorage` entfernt. Person–Kunde-Zuordnungen werden pessimistisch über `OrganizerContact` gespeichert.
- Event-Workspace vertieft: Speichern, Versionskonflikte, Datumsnormalisierung und Outlook-Synchronisierung liefern explizite Ergebnisse hinter einem Interface.
- Outlook-Eventordner-Modul vertieft: Jahreszuordnung, Quartalspfad, Drift-Erkennung und Synchronisierung liegen in einem Modul; Route und Controller enthalten keine eigene Ordnerpolicy mehr.
- TDD-Abdeckung ergänzt: 9 Root-Unit-Tests, 4 Event-Service-Tests und 17 serielle Browser-E2E-Tests erfolgreich; Frontend- und Backend-Build erfolgreich.

## 2026-08-22

- Issue #28 abgeschlossen: Gantt-Zoom-Test präzisiert, Kunden- und Outlook-Ansichten über stabile URL-Zustände erreichbar gemacht, Outlook-Sync mit sichtbarer Statusmeldung ergänzt und E2E-Mocks korrigiert. Verifiziert mit 13 grünen Browser-E2E-Tests und erfolgreichem Produktions-Build.

## 2026-08-20

- Veranstaltungsbereich um kompakte Reiter für Liste, Kalender und Gantt ergänzt; die Liste bleibt die tabellarische Standardansicht.

## 2026-08-17

- Adopted Invoice Ninja-inspired canonical statuses for offers, invoices, and credits/gutschriften in `t2w-base`; `Overdue` and `Unpaid` remain derived indicators.
- Chose stricter audit-safe behavior than Invoice Ninja for issued-document deletion and permanent non-reuse of document numbers.
- Chose ZUGFeRD/Factur-X as the standard hybrid invoice artifact, with extractable XML and additional `ebInterface`/Peppol exports only when needed.
- Added configurable OneDrive archival as a second storage target, preserving the current year-based `EVENTFINANCE`/`03_rechnungen` filing pattern.
- Deferred `ebInterface` from the initial implementation; ZUGFeRD/Factur-X remains the initial standard invoice artifact.
- Deferred Peppol/UBL as well; version 1 produces only ZUGFeRD/Factur-X.
- Clarified that offer-to-invoice conversion only copies data for convenience; invoice values may exceed or differ from the offer because participant counts are often unknown when quoting.
- Chose new offer numbers instead of separate version numbers; predecessor offers remain linked and can be marked `Replaced`.
- Clarified that expired offers may still be approved and converted; `Expired` is only a warning indicator.
- Set the primary scope constraint: keep the invoice tool lean, replace the ClickUp invoice list, improve traceability, and accelerate quote creation rather than building a complex accounting suite.
- Confirmed two fast quote-entry paths: copy an existing offer or use a reusable customer/event-prefilled offer template.
- Deferred importing existing ClickUp invoices and OneDrive PDFs; migration will not block the initial billing workflow.
- Decided that TIME2WIN participant counts are manual-refresh proposal values; accepted quantities are copied into offers and never auto-overwrite existing documents.
- Added transparent multi-factor line-item calculations for cases such as hourly rate per person; initial scope allows up to two factors.
- Added simple product-level calculation defaults for price basis and factor units, without introducing a general formula engine.
- Clarified that events use date-based active/past visibility; past events remain accessible through a separate selection instead of being deactivated like master data.
- Decided that event completion is manual with an open-todo warning, not automatic from the event date.
- Allowed a limited return from `Sent`/`Ausgestellt` to `Draft` before external delivery or payment, as a deliberate simpler-than-Invoice-Ninja workflow.
- Clarified that `Ausgestellt` is reversible before delivery, while the separate `Versendet` action is the final immutability boundary.
- Decided that recording a payment automatically activates an `Ausgestellt` invoice and derives its payment status.
- Chose to allow payment edits and deletion with audit logging and automatic invoice-status recalculation.
- Confirmed that overpayments remain allocatable customer credit and can be manually refunded.
- Applied the no-delete-after-issue rule to credits/gutschriften as well.
- Confirmed independent German/English localization for UI and billing documents with stable internal status codes.
- Confirmed one centrally configured issuing company for version 1; historical documents retain their original company profile snapshot.
- Chose permanent confirmed deletion for drafts without a recycle bin; retain minimal deletion metadata in the audit log.
- Confirmed append-only, immutable audit logs readable by all users without role restrictions.
- Simplified the billing MVP to six invoice states (`Entwurf`, `Ausgestellt`, `Versendet`, `Teilbezahlt`, `Bezahlt`, `Storniert`) and deferred Invoice-Ninja-style reverse/guthaben complexity.
- Kept both invoice-based and standalone credits, but limited MVP application to a simple one-credit-to-one-invoice relationship.
- Confirmed zero-value invoices are allowed and immediately `Bezahlt` without payment QR; negative invoices are not allowed.
- Further simplified the MVP: invoice-based credits only, core `quantity x unit price` calculations, and manual OneDrive upload to configured year/document folders without sync automation.
- Kept event creation out of the billing dialog; events are pre-existing optional links for offers and invoices.
- Applied the same reversible-before-delivery and immutable-after-delivery rule to offers.
- Applied the same delivery boundary to credits/gutschriften.

## 2026-06-15

- Initialized Karpathy-style LLM wiki scaffold.
- Added `AGENTS.md` schema, raw source intake area, and wiki section indices.
- Captured initial Temptwin product brief from user conversation.
- Added specification v1, delivery phases, and AI-oriented roadmap.
- Added initial entity, concept, and decision pages for the product direction.
- Refined the CRM scope so customers are modeled as organizers with multiple contacts and roles.
- Refined project operations around event templates, critical path visibility, mixed assignment targets, and invoicing scope.
- Documented the current tool landscape and defined GCW Base as the consolidation target for Zendooin, ClickUp, and `n8n` workflows.
- Inspected the current `VERANSTALTUNGEN.xlsx` export and modeled `Event` plus linked `Veranstaltungsmanagement` as core domain concepts.
- Inspected one event-management export and refined the grouped task-section model for concrete event execution.

## 2026-06-29

- Inspected the live ClickUp workspace structure and confirmed separate `KUNDEN`, `KONTAKTE`, and `RECHNUNGEN` lists in addition to `VERANSTALTUNGEN` and event-specific management lists.
- Recorded live data volumes for the CRM-like and invoice lists and documented their current statuses and modeling implications.
- Captured data-quality issues in ClickUp, including duplicate customer records and mixed contact/entity types that will affect CRM migration.
- Captured a more precise event-finance role model from user conversation, including independent invoice recipients, sponsor billing, mixed legal entities per event, and `Nenngeld` payouts to organizer-side entities.
- Inspected the Tauern Circle ART workbook and documented that the current offer and invoice process is based on shared line items, customer/event master data, and embedded price calculations.
- Captured the end-state vision that event records should aggregate communication across channels such as Outlook and WhatsApp into a shared event timeline.

## 2026-06-30

- Consolidated a first target model for GCW Base covering the event record, organizer and contact handling, offer and calculation behavior, file links, and event-centered communication.
- Clarified that ClickUp is a migration source rather than a target dependency, while invoice creation remains in Excel for the first stage.
- Created an MVP task note for event CRM with contacts, manual event communication, and external invoice references.
- Added an implementation-oriented backlog for the MVP, prioritizing schema, CRUD, roles, communication, document references, and event lists.
- Set up a local Penpot Docker stack for UI design work at `http://127.0.0.1:9001`, using the official Penpot compose template with local mailcatch on `http://127.0.0.1:1080`.
- Created the first Penpot UI mockup for the event CRM as a table-view SVG import in `Neue Datei 1`, using the asset `local-services/penpot/event-crm-table-view.svg`.
- Added a second Penpot ops-console variant in `Neue Datei 1` using `local-services/penpot/event-crm-ops-console.svg`.
- Added a third Penpot Stripe-style backend variant in `Neue Datei 1` using `local-services/penpot/event-crm-stripe-backend.svg`.
- Added a fourth Penpot admin-table variant in `Neue Datei 1` using `local-services/penpot/event-crm-stripe-admin-table.png`, with a Stripe-like left nav, KPI cards, event/invoice table, and right detail panel.
- Added a fifth Penpot slim event-detail variant in `Neue Datei 1` using `local-services/penpot/event-crm-event-detail-minimal.png`, focused on the MVP fields only.
- Added a separate `Page 2` in the Penpot file so the slim event-detail MVP view can be surfaced independently in the sidebar.
- Added a sixth Penpot slim event-list variant in `Neue Datei 1` using `local-services/penpot/event-crm-event-list-minimal.png` and surfaced it as a separate `Event List MVP` page.
- Added a seventh Penpot `MVP Flow` page in `Neue Datei 1` using `local-services/penpot/event-crm-mvp-flow.png` to show the intended navigation from list to detail to TIME2WIN.
- Captured the working event-status set from user conversation: `Anfrage`, `Angebot gesendet`, `Zugesagt`, `Abgesagt`, `Akquise`, and `Datum prüfen`.
- Captured the working invoice-status set from user conversation: `erstellt`, `gesendet`, and `bezahlt`.
- Captured that event addresses are optional in v1 but recommended for arrival and logistics planning.
- Captured that event addresses should not trigger automatic technical suggestions in the MVP.
- Captured that the event owner field is optional in the MVP.
- Captured that an event may have multiple internal team members even without fixed roles.
- Captured that organizer-side contacts are `Anmeldung` and `Finanzen` by default, with `Timing` optional.
- Captured that each event should carry explicit `OneDrive` and `Eventfinance` folder references.
- Captured that the MVP does not need additional file-link fields beyond the two folder references.
- Captured that event communication in the MVP is manual only, without Outlook or WhatsApp aggregation yet.
- Captured that the MVP event model does not need a separate follow-up date.
- Captured that the manual activity list should act as a simple event timeline in the MVP.
- Captured that event completeness should be shown with subcategories such as registration, printing materials, personnel, and timing.
- Captured that the event completeness subcategory list should stay extensible.
- Captured that each event should keep its own structured address, even if it matches the organizer address.
- Captured that contact roles stay extensible beyond the initial core roles.
- Captured that roles are handled on both organizer and event level, with organizer defaults and event overrides.
- Captured that the MVP does not need fixed standard assignments for the core contact roles.
- Captured that events use an internal numeric id plus a human-readable `eventcode` as primary identifiers in the MVP.
- Captured that `eventcode` is suggested from `YYYYMMDD` plus the first four meaningful cleaned words of the event name, but remains manually editable.
- Captured the `eventcode` cleaning rules: umlauts to ASCII digraphs, underscores for spaces and hyphens, special characters removed, and stop words skipped.
- Captured that `t2w_event_id` should be visible in the MVP and link to the TIME2WIN backend when available.
- Collected backend UI inspiration references from Stripe, Supabase, Retool, and Vercel for future dashboard styling.
- Created a new local Penpot project for an additional TIME2WIN payroll UI variant and imported `local-services/penpot/payroll-lohnuebersicht-soft-variant.png`.
- Added the source page `wiki/sources/2026-07-01-penpot-payroll-lohnuebersicht-soft-variant.md` plus the new SVG/PNG assets for the payroll overview variant.

# 2026-07-07

- Added a source page for the user request about an event-centered mail analysis and knowledge service.
- Added the concept page [concepts/event-communication-knowledge-service.md](concepts/event-communication-knowledge-service.md) to capture a proposed pipeline, data model, matching strategy, MVP slice, and risks.

## 2026-08-17

- Explored an Invoice Ninja-inspired T2W Base shell with left-side navigation, top global search, and an operations-focused overview for events, tasks, invoices, and communication. Inline mockup: `t2w-invoice-ninja-layout.html` in the thread visualization workspace.
- Discussed additional event-planning views: calendar, week, event-weekend, and Gantt/timeline. Proposed using them as synchronized projections of the same event/task data, with Gantt inside event detail and the weekend view focused on live operations.
- Refined the planning requirement: the weekly overview must show event counts per day together with resource capacity rows, especially vehicles. A resource-calendar mockup was created with day totals, vehicle/team rows, and visible conflicts.

# 2026-08-17

- Concrete communication-hub UX and implementation shape added to [Event Communication Knowledge Service](concepts/event-communication-knowledge-service.md): unified event timeline, latest-facts/open-loops side rail, channel adapters, review queue, and phased delivery.
- MVP priority clarified: fast manual phone-call notes per event plus a unified searchable view of notes and email messages; automated intelligence and WhatsApp integration follow later.
- Outlook folder convention confirmed as a practical integration path: synchronize each event folder automatically; handle Sent Items by folder membership first and message matching as fallback.
- Follow-ups clarified as ordinary event todos linked to their source communication, rather than a separate "Wiedervorlage" concept.

# 2026-08-18

- Split the lean Invoice MVP parent issue [#1](https://github.com/AndiT2W/t2w-base/issues/1) into twelve dependency-ordered tracer-bullet tickets #2–#13, all marked `ready-for-agent`.
- The first implementation target is [#2 Billing-Grundgerüst und erster Angebotsentwurf](https://github.com/AndiT2W/t2w-base/issues/2).

# 2026-08-19

- Verbindliche Eventstatuswerte aus dem Wiki bestätigt: Anfrage, Angebot gesendet, Zugesagt, Abgesagt, Akquise und Datum prüfen. Die bisherige UI-Statusliste ist fachlich überholt.
- Neue Events starten standardmäßig mit dem Status `Anfrage`.
- Eventfeldentscheidung: Risiko wird nicht als Eventfeld geführt.
- Eventort bleibt im aktuellen MVP ein Freitextfeld; strukturierte Adressdaten sind nicht erforderlich.
- Sportart wird als erweiterbares Dropdown mit direkter Option zum Hinzufügen einer neuen Sportart geführt.
- Veranstalter wird über ein Such-Dropdown gewählt; neue Veranstalter können direkt aus dem Modal angelegt werden.
- Ort bleibt ein optionales Freitextfeld.
- Hauptverantwortlicher ist im Anlageformular optional. Teilnehmerzahlen werden nicht manuell im Modal erfasst, sondern bei gesetzter `t2w_event_id` einmal täglich aus TIME2WIN synchronisiert. Technologien/technische Leistungen werden optional auf der Detailseite gepflegt.
- Teilnehmerprognose und aktueller, aus TIME2WIN synchronisierter Teilnehmerstand werden getrennt gespeichert.
- `t2w_event_id` erhält auf der Eventdetailseite einen eigenen Reiter `TIME2WIN-Verknüpfung` neben `Stammdaten`.
- Die TIME2WIN-Verknüpfung zeigt Bewerbe und Teilnehmerstatistiken je Bewerb sowie Synchronisierungsstatus und manuelle Aktualisierung.
- Pro Bewerb wird im MVP ausschließlich die Zahl der gemeldeten Teilnehmer angezeigt.
- Einzelteilnehmer und Teams werden dabei nicht getrennt ausgewiesen.
- Sportart kann bei verknüpfter `t2w_event_id` aus der TIME2WIN-API stammen. Ohne ID wird sie manuell gepflegt; eine spätere API-Abweichung überschreibt den manuellen Wert nicht ungefragt.
- Die Lovable-Referenzoberfläche wurde als UI-Basis übernommen und auf dem Hostinger-VPS unter `https://base.time2win.cloud` deployed. Traefik terminiert TLS; die Anwendung verwendet ihren eigenen Login. Deployment-Konfiguration: `Dockerfile.hostinger`, `docker-compose.yml` und `nginx/hostinger.conf`.
- Issue #17 begonnen: kanonische Eventstatuswerte, Veranstalter-/Sportart-/Teilnehmerwert-Typen sowie getrennte Teilnehmerprognose und aktuelle Quelle in der zentralen Daten-/Store-Schicht ergänzt. Ladefehler werden für Konsumenten exponiert; bestehende Legacy-Datensätze bleiben vorerst kompatibel.
- Issue #23 Event-Service auf Hostinger deployed: eigene PostgreSQL-Instanz, Prisma-Migration, NestJS-API, Session-Auth, Stammdaten-CRUD und täglicher Backup-Container. Login und geschützter Event-GET-Smoke-Test erfolgreich.
- Eventdetailseite bereinigt: Teilnehmer, Verantwortlicher und Risikoindikator entfernt. Risiko ist nun auch aus dem zentralen `T2WEvent`-Modell, Eventdialog, Filtern, Spalten und Variantenansichten entfernt.
- Breadcrumb-Navigation korrigiert: `TIME2WIN` ist der neutrale Root; `Übersicht` wird nur auf der Übersichtsseite als aktueller Bereich angezeigt.
- 2026-08-19: Stammdaten und Eventübersicht zeigen Outlook- und SharePoint-Ordner als klickbare Links mit Kopierfunktion. SharePoint-Links werden aus Jahres-Site und kodiertem Ordnerpfad gebildet; Outlook verweist derzeit auf Outlook Web, da im Modell nur der Ordnerpfad gespeichert ist.
- 2026-08-19: Fehlerbehebung deployed: Event-Stammdaten werden beim Speichern über die PATCH-API persistiert, Veranstalter werden als Organizer wiederverwendet/angelegt, und ein SVG-Favicon verhindert den bisherigen `/favicon.ico`-404.
- 2026-08-19: Lokale Demo-/Persistenzpfade entfernt: der Store startet ohne Demo-Events und lädt Eventdaten ausschließlich über den Event-Service. Outlook- und SharePoint-Ordner liegen nun als Felder in PostgreSQL; Migration `0002_event_folders` ergänzt die Spalten.
- 2026-08-20: Issue #22 teilweise umgesetzt: veraltete Statuswerte aus dem TypeScript-Eventmodell und den aktiven UI-Regeln entfernt; Anlage, Angebote, Kalender, Rechnungen und Ops-Filter verwenden die kanonischen Statuswerte.
- 2026-08-20: Issue #22 Anlageflow nachgeschärft: neue Events werden erst nach erfolgreichem POST in den Store übernommen und anschließend mit dem echten API-Datensatz geöffnet; Veranstalter werden bereits beim Anlegen persistiert. TIME2WIN-Synchronisierung bleibt abhängig von Issue #21.
- 2026-08-20: Playwright/Chromium-Browser-E2E-Testsetup für Issue #22 ergänzt. Drei Szenarien decken Übersichtsladen, Eventanlage per POST und Veranstalteränderung per PATCH ab; vollständiger Lauf: 3/3 bestanden.
- 2026-08-20: Einstellungen erweitert: Outlook kann je Jahr einen eigenen Stammordner verwenden; der globale Stammordner bleibt als Fallback. Das Zurücksetzen der Einstellungen leert den Eventbestand nicht mehr.
- 2026-08-20: Projektregel ergänzt: Jedes neue Feature benötigt einen Regressionstest; bevorzugt wird ein echter Browser-E2E-Test des vollständigen Nutzerablaufs.
- 2026-08-20: Event-Stammdaten um `outlookWebUrl` erweitert. Der direkte Outlook-Web-Link wird nun pro Event gespeichert, über die API persistiert und beim Outlook-Link verwendet; der bisherige Ordnerpfad bleibt als lesbare Zusatzinformation erhalten.
- 2026-08-20: SharePoint-Jahres-Sites werden in den Einstellungen numerisch absteigend nach Jahr sortiert; die aktuellste Site steht oben und die Sortierung wird beim Speichern dauerhaft übernommen.
- 2026-08-20: Demo-Datei und Demo-Texte aus der Anwendung entfernt; die Oberfläche verweist nun auf den zentralen Event-Service als Datenquelle.
- 2026-08-20: Hinweis zur Unveränderlichkeit des Eventcodes aus der Stammdaten-Kopfzeile entfernt und als kleine Zusatzinformation direkt an die Eventcode-Feldbeschriftung verschoben; E2E-Regressionstest ergänzt.
- 2026-08-20: Eventcode in der Eventdetail-Kopfzeile in dieselbe Metadatenzeile wie Veranstalter und Datum verschoben; E2E-Regressionstest ergänzt.
- 2026-08-20: In der Eventübersicht die Sammelüberschrift `Ordner` durch Outlook-/SharePoint-Symbole ersetzt und dieselben Symbole in den klickbaren Zeilenlinks ergänzt; E2E-Regressionstest ergänzt.
- 2026-08-20: Mehrsprachigkeit als Designgrundlage festgehalten: Deutsch (`de`) ist Default und Fallback, Englisch (`en`) wird ab Beginn parallel unterstützt; UI-Texte, Formatierungen und stabile sprachneutrale Fachcodes sind entsprechend auszulegen.
- 2026-08-20: Spezifikation für die mehrsprachige Produktgrundlage als [GitHub Issue #26](https://github.com/AndiT2W/t2w-base/issues/26) veröffentlicht und mit `enhancement` sowie `ready-for-agent` markiert.
- 2026-08-21: Sichtbarer Sprachumschalter in der gemeinsamen Sidebar ergänzt; Deutsch/Englisch kann dort gewählt werden und die Präferenz bleibt über Sitzungen erhalten. Browser-E2E-Test für den Bedienablauf ergänzt.
- 2026-08-21: TIME2WIN-CI umgesetzt: Markenfarben `#8DC63F`/`#05193A`, freigegebenes `time2win_logo_button.svg` als Sidebar-Icon und Favicon integriert. Ausgangs-Stylesheet als `src/styles_begin.css` archiviert; CI-Stand auf `https://base.time2win.cloud` deployed.

# 2026-08-20

- Implemented the first Outlook folder integration slice for issue #25: Graph adapter seam, stable event folder IDs/status fields, idempotent year/quarter/event folder provisioning, and a protected event sync endpoint.
- Verified with `npm run build` and the event-service Vitest suite.
- Dokumentation nachgezogen: Issue #24 und die Wiki-Konvention beschreiben jetzt die AppSettings-PostgreSQL-Persistenz, die Ursache des asynchronen Formular-State-Fehlers sowie die verbindliche E2E-Regel für neue persistente Features. Der Browser-Test muss den vollständigen UI-Ablauf abdecken und darf den PATCH nicht nur direkt per `fetch` auslösen.
- 2026-08-21: Issue #25 vervollständigt: Microsoft-Graph-Client-Credentials, paginierte Child-Folder-Suche, 409-Race-Recovery, Rate-Limit-/Sync-Status, Eventdetail-Sync-Aktion, Persistenzanzeige und Outlook-Adaptertests ergänzt.
- 2026-08-21: Die Listenansicht „Veranstaltungen“ verwendet nun dieselbe schlanke Eventtabelle wie die Übersicht; ein Browser-E2E-Test schützt die acht Kernspalten und Ordner-Symbole.
- 2026-08-21: Kontakte-Menü als „Kunden & Kontakte“ spezifiziert. Person und optionales Kundenprofil werden als ein Stammdatensatz modelliert; Veranstalter, Auszahlungsempfänger und ein oder mehrere Rechnungsempfänger sind getrennte Eventrollen. Outlook-/Gmail-Synchronisation wird nur vorbereitet. Siehe [Entscheidung Person, Kundenprofil und Eventrollen](decisions/2026-08-21-person-kundenprofil-und-eventrollen.md) und [Issue #27](https://github.com/AndiT2W/t2w-base/issues/27).
- 2026-08-21: Gantt-Ansicht um eine dreistufige Zeitachse mit Monaten, Kalenderwochen und Tageszahlen sowie Tagesraster ergänzt; Browser-E2E-Test erweitert.
- 2026-08-21: Gantt-Wochenenden und österreichische gesetzliche Feiertage werden in Kopfzeile und Tagesraster hervorgehoben; Feiertagsnamen sind per Tooltip sichtbar.
- 2026-08-21: Fehler bei der Eventcode-Persistenz behoben: Die automatisch erzeugte Vorschau ist beim Anlegen editierbar, wird im POST mitgesendet und bleibt nach dem Speichern unveränderlich; der Service verwendet den übergebenen Code statt `YYMMDD_event_<Zeitstempel>`.
- 2026-08-21: Issue #28 umgesetzt: Sidebar bereinigt, Sprachumschalter auf DE/EN reduziert, Eventaktion als Bearbeiten-Symbol dargestellt, Kalender um Tagesansicht sowie Wochenend-/Feiertagsmarkierung ergänzt und Gantt um horizontales Scrollen, Zoomauswahl und Eventzählung erweitert.
- 2026-08-21: Mehrsprachigkeit weiter umgesetzt: SSR-hydrationssichere Locale-Auswahl, echte Übersetzungsschlüssel für Sidebar/PageHeader/Eventdetail/Kalender/Varianten, verzögerte Übersetzung statischer UI-Texte sowie E2E-Abdeckung für Umschalter, Detailseite und alle Hauptrouten. Verifiziert mit `npm run build` und drei grünen Tests in `tests/e2e/language.spec.ts`.
- 2026-08-22: Live-Regression beim Sprachumschalter behoben: DE/EN verwendet jetzt hydration-sichere Hash-Navigation ohne Seitenreload; der aktuelle Stand wurde auf Hostinger deployed. Verifiziert mit drei lokalen Sprach-E2E-Tests und einer Live-Browserprüfung ohne Seitenfehler.
- 2026-08-22: Automatischer Hostinger-Deploy per GitHub Actions ergänzt. Pushes auf `main` bauen die App, laden ein `git archive` per SSH nach `/docker/t2w-base` und aktualisieren ausschließlich `app`/`nginx` per Docker Compose; Hostinger-Zugangsdaten bleiben GitHub-Environment-Secrets.
- 2026-08-22: Issue #28 nachbereinigt: die abgelösten Design-Varianten, ihre Routen und der Vergleichslink im Styleguide wurden entfernt; der Sprach-E2E-Test prüft nur noch die aktiven Anwendungsrouten.
- 2026-08-22: ClickUp-Import-Excel geprüft. Für den Eventimport müssen Kunde, Veranstalter, Rechnungsempfänger und Auszahlungsempfänger über stabile Stammdaten-IDs bzw. eine separate Zuordnungstabelle verknüpft werden; `Rechnungsempfänger` ist im Export leer, `Auszahlungsempfänger` Freitext. Wiederholte Kopfzeilen und Zeichencodierungsfehler wurden als zusätzliche Bereinigungen festgestellt.
- 2026-08-22: Importregel vereinbart: Ist der Rechnungsempfänger leer, wird der Auszahlungsempfänger als Rechnungsempfänger verwendet; die automatische Übernahme soll nachvollziehbar markiert werden.
- 2026-08-22: Fehlende englische Übersetzungen für Eventstatus und Schnellfilter ergänzt; die Sprach-E2E-Tests prüfen jetzt auch „Confirmed“ und „All statuses“.

## 2026-08-22

- Ticket #29 umgesetzt/weitergeführt: Dashboard zeigt Outlook-/SharePoint-Ordner in der Tabellenansicht nur noch als Symbole; Kalenderansichten erlauben horizontales Scrollen und zeigen Feiertagsnamen sichtbar an.
- Zahlungsziel aus dem CRM-Kundenmodell, Demo-Daten, Erzeugung und UI entfernt. CRM-Zuordnungen unterstützen Suche und Aufheben.
- Verifikation: `npm run build` erfolgreich. Repository-Lint bleibt wegen bestehender Prettier-/CRLF-Fehler in vielen Dateien rot.

# 2026-08-22

- Deepened the locale rendering module: removed the global DOM `MutationObserver`, added the explicit `useI18n().text` rendering seam, migrated shared page headers and overview status/filter text, and verified all language E2E tests.
- 2026-08-23: Issue #30 erstellt: Veranstalter im Event wird verbindlich über eine stabile Kunden-ID mit „Kunden & Kontakte“ verknüpft. Festgelegt wurden Migration bestehender Freitextwerte, Rückverknüpfung im Kundenprofil, manuelles Aufheben, getrennte Eventrollen und Browser-E2E-Tests.

# 2026-08-23

- Offene Ticket-29-Verbesserungen nachgezogen: Kalender- und Gantt-Ansichten erzwingen auf kleinen Viewports eine echte horizontale Scrollfläche; E2E-Regressionsabdeckung ergänzt für österreichische Feiertagsnamen, Scrollbarkeit, CRM-Zuordnungsaufhebung nach Reload und das entfernte Zahlungsziel.
- Verifikation: vollständige Playwright-Suite 17/17 grün; Produktions-Build erfolgreich.
- Locale rendering module vertieft: Katalog-Fallback, Legacy-Textübersetzung sowie Datums-/Zahlenformatierung liegen jetzt hinter `createLocaleRenderer`; der React-Kontext delegiert nur noch an dieses Interface. Unit-Regressionsabdeckung für Schlüssel, Fallback, Legacy-Text und Formatierung ergänzt.
- Vitest als Root-Testlauf eingerichtet (`npm test`) mit Node-Testumgebung und zentraler Konfiguration; der Locale-Rendering-Test läuft als erster Root-Unit-Test.
- Node.js benutzerlokal auf `v22.14.0` aktualisiert; die vorherige Vite-Engine-Warnung für `v22.11.0` tritt nicht mehr auf.
- 2026-08-23: Issue #30 erweitert: Namen-/Layoutkorrektur in „Kontakte & Kunden“, konsequente Umbenennung des Menübereichs sowie strukturiertes Adressmodell für Kontakte und Kunden mit Straße, Postleitzahl, Ort und Land inklusive Migration, Versandlisten-Tauglichkeit und E2E-Abdeckung.
- 2026-08-23: Issue #31 ergänzt: mobile Kalenderansicht muss Überschrift, Navigation, Legende und Raster innerhalb des Handy-Viewports darstellen; ungewollter horizontaler Overflow ist zu vermeiden und die mobile Darstellung per Browser-/Visual-Test abzusichern.
- 2026-08-23: Kunden-Detaildialog auf eine zugängliche Such-Combobox umgestellt. Kontaktoptionen filtern dynamisch; Pfeiltasten, Enter und Escape sowie ARIA-Combobox-/Listbox-Zustände sind abgedeckt. Vollständige Playwright-Suite 17/17 und Produktions-Build erfolgreich.
- 2026-08-23: Issue #30 ergänzt: Persistenzfehler bei der Neuanlage von Kontakten/Kunden für Funktion und Ort/Adresse sowie E2E-Abdeckung von Anlage, Detailansicht und Reload-Persistenz.
- 2026-08-23: Event-Architektur weiter vertieft: Der Event workspace besitzt nun die persistierte Event-Sammlung und alle pessimistischen Create/Save/Sync-Übergänge; React beobachtet sie über einen External-Store-Seam. Backend-Eventmutationen bündeln Veranstalterauflösung, Empfängerdefaults, Versionskonflikte und Empfängerersetzung atomar hinter einem Domain-Modul mit Prisma- und In-Memory-Adaptern.
- 2026-08-23: Vier Architektur-Deepenings umgesetzt: CRM workspace für autoritativen Zustand und kombinierte Übergänge, gemeinsame Event-Projektionen für alle Ansichten, Settings workspace mit Dirty-sicherem asynchronem Laden sowie ein einziges Locale-Rendering-Interface für Schlüssel und sichtbaren Text. Die bestehenden HTTP-/Persistenzinterfaces bleiben kompatibel.

# 2026-08-24

- CRM-Kundenzuordnung aus der Kontaktansicht repariert: Die Such-Combobox wartet den Persistenzrequest nun ab, verhindert doppelte Eingaben und zeigt Erfolg oder Fehler sichtbar an. Ein Browser-E2E-Test prüft den konkreten `PUT`, die sichtbare Verknüpfung und deren Persistenz nach Reload; beide Zuordnungsrichtungen sind grün.

# 2026-08-25

- Expanded the persistent Event workspace for ticket #20: event roles, tasks, file references, and manual activities now have Event-Service persistence models and detail-page actions. TIME2WIN link state is surfaced separately from the local participant forecast. Evidence: `services/event-service/prisma/migrations/0007_event_workspace/migration.sql`, `src/routes/events.$eventcode.tsx`.

# 2026-08-25

- Fixed ticket #30: contact function and location were collected in the UI but omitted by the HTTP CRM mapping and database model. They now persist via `Contact.function` and `Contact.location`; the customer creation form also exposes its billing address. A browser E2E test covers create, detail display, and reload persistence.

# 2026-08-25

- Implemented ticket #31 mobile time-navigation foundation: calendar and Gantt own bounded horizontal scroll regions, the Gantt axis includes a 90-day buffer before and after event data, and the mobile navigation trigger is sticky. Browser coverage verifies mobile scroll regions, trigger visibility, and no page-level horizontal overflow.

# 2026-08-25 – Produktionsmigrationen zuverlässig ausführen

- Login-Ansicht wurde durch HTTP-500-Antworten der geschützten Startabfragen ausgelöst, nicht durch ungültige Zugangsdaten.
- Ursache: Der Deployment-Workflow aktualisierte `event-service`, baute aber den profilbasierten `event-migrate`-Container nicht neu. Dadurch fehlten die Migrationen `0007_event_workspace` und `0008_contact_function_location` in PostgreSQL.
- Die beiden ausstehenden Migrationen wurden in Produktion eingespielt; der Workflow baut `event-migrate` nun vor dem Migrationslauf. Evidenz: [Deploy-Workflow](../.github/workflows/deploy-hostinger.yml), [Migration 0007](../services/event-service/prisma/migrations/0007_event_workspace/migration.sql), [Migration 0008](../services/event-service/prisma/migrations/0008_contact_function_location/migration.sql).

# 2026-08-25

- Removed the obsolete CRM customer status `In Prüfung`. The domain permits only active or inactive customers, new customer profiles start active, and legacy local-demo records with the old value are normalized to active on load.

# 2026-08-25

- Replaced the customer billing-address field with structured customer fields: country, city, street, postal code, and email. The Event-Service migration retains legacy address data in the existing column and seeds the new street/email fields from legacy values where empty.

# 2026-08-25

- Added the Event detail workspace's Finanz tab. It persists one payout recipient and multiple invoice recipients through the existing Event-Service relationships; the selected organizer remains the default for both. Browser coverage verifies the visible controls and submitted recipient IDs.

# 2026-08-25

- The Event detail contact tab now distinguishes the organizer's CRM contacts from explicit event contacts and roles. Organizer contacts can be adopted individually as an event contact without changing their CRM association.

# 2026-08-25

- Contact and customer detail forms now validate optional mail addresses and contact private/work phone numbers before their inline persistence, showing accessible field errors and preserving invalid drafts for correction.

# 2026-08-25

- The selected Event payout recipient now displays read-only customer master data (name, structured address, UID, IBAN, BIC). BIC is mapped and persisted through the CRM client model and editable in customer master data.

# 2026-08-25

- Event invoice recipients use a searchable multi-select dropdown and display the same read-only customer master data for every selected recipient.

# 2026-08-25

- Event organizer references now cross the event creation and update seam by stable organizer ID, never by the display name selected from CRM. Changing an Event's organizer resets payout and invoice defaults to that same ID.

# 2026-08-25

- Removed the unused legacy organizer free-text fields `billingInfo` and `payoutInfo` from the Event-Service schema with a migration. The CRM customer table no longer exposes the internal organizer type and both CRM tables support ascending/descending sorting through their headers.

# 2026-08-25

- Added the customer email to the CRM customer table. Users can choose the visible customer-table columns, with the selection stored in browser local storage.

# 2026-08-25

- Standardized the tables in the overview, event list, contacts, and customers around shared column-selection and sortable-header controls. Each view persists its visible columns independently in the browser.

# 2026-08-25

- Implemented the architecture deepening slice: pure table preference/sorting behavior with regression tests, CRM workspace intent aliases for contact association operations, and atomic event contact-role mutation behind the event mutation adapter. Root and event-service test suites pass; production build succeeds. Existing repository-wide lint still reports unrelated baseline formatting errors.

# 2026-08-25

- Fixed persistence of a customer's primary contact: the CRM client now includes `primaryContactId` in organizer update requests. Browser coverage verifies the value after reload.

# 2026-08-28

- Ticket #21 umgesetzt: Der Event-Service synchronisiert TIME2WIN-Eventmetadaten und Teilnehmerzahlen pro Bewerb über eine konfigurierte Bearer-API, speichert den letzten erfolgreichen Snapshot und zeigt Sync-Status bzw. Fehler an. Lokale Sportart und Teilnehmerprognose bleiben unverändert. Der TIME2WIN-Tab erlaubt den manuellen Sync; ein täglicher Service-Job aktualisiert verknüpfte Events.

- TIME2WIN-Teilnehmer-Sync korrigiert: Die Produktionsantwort für Event 1082 liefert Bewerbzahlen als `races[].participants_count` und die Sportart als `type_name`. Der Service normalisiert diese Felder nun; ein Unit-Regressionstest verwendet das reale Antwortformat und ein Browser-E2E-Test prüft die sichtbare Teilnehmerzahl nach dem manuellen Sync.

- Ticket #19 ergänzt: Der Kalender verwendet nun dieselbe Archivselektion wie die Eventliste (aktive, archivierte oder alle Events). Ein Browser-E2E-Test prüft außerdem den Filterablauf und die Navigation vom Kalenderbalken in die Eventdetailseite.

- Implemented [GitHub issue #34](https://github.com/AndiT2W/t2w-base/issues/34): configured role selection for existing Event contacts, Outlook folder existence feedback before and after sync, accessible overlays and table actions, mobile event cards and touch targets, overview urgency feedback, and semantic language buttons. See [Ticket #34: UI und Outlook-Sync-Rückmeldung](concepts/ticket-34-ui-and-outlook-sync-feedback.md).

- Recorded the verified URL-encoded Outlook Web folder link for [Mountain Attack 2027](entities/mountain-attack-2027.md). The original, non-encoded version opened the inbox instead of the event folder.

- Outlook folder sync now stores `https://outlook.cloud.microsoft` links with URL-encoded mailbox and Graph folder ID. A regression test covers Outlook folder IDs that end in `=`.

# 2026-08-26

- Implemented UI ticket #33: overview status dropdown and legend, simplified CRM customer columns and filters, icon-only folder links, editable action wording, and Gantt today-centering with a sticky event column. Updated affected browser assertions; unit tests pass.

# 2026-08-27

- Deepened the Event workspace and Event mutation modules: Event contact, task, file, and activity commands now cross intent-level module interfaces, return refreshed Event state, and enforce Event version conflicts. HTTP and Prisma remain adapters behind those seams; regression tests cover refreshed snapshots and stale detail commands.

- Deepened table preferences behind a browser-storage adapter and an in-memory test adapter. Preference persistence now uses an explicit format that preserves deliberately hidden columns while still recovering legacy preferences. CRM relationship adapters now return refreshed snapshots, and the CRM workspace owns state replacement through one relationship intent per direction.

- Added the Settings **Auswahllisten** tab. It centrally manages the Event sport selection: Sportarten can be created, renamed, activated, or deactivated; Event forms continue to receive only active values. The tab is the extension point for future selection lists.

- Added persisted Event role options to **Auswahllisten**, seeded with `Anmeldung` and `Finanz`. Active options are available when assigning an Event contact; roles can be added, renamed, activated, or deactivated without rewriting existing Event relationships.

- Placed Event start and end dates side by side in the Event creation dialog; browser coverage guards that shared row layout.

- Implemented architecture recommendations 1-4: cohesive Event editing sessions, a shared selection-list workspace, centralized table behavior, and direct-first Outlook/SharePoint folder navigation. Added focused unit regressions and verified all 31 Event browser workflows.

- Captured follow-up UI feedback in [GitHub issue #34](https://github.com/AndiT2W/t2w-base/issues/34): roles of existing Event contacts should be editable via the centrally managed role dropdown rather than free text. The issue is intentionally an extensible collection point for further Event-detail UI improvements.

- Moved the shared sport and Event-role lifecycle into the framework-free `@t2w/domain/selection-lists` module. Prisma and browser HTTP mocks are now adapters around that lifecycle; the reusable mutable browser adapter keeps selection-list workflows covered end to end.

- Removed the pass-through Nest Event mutation service. `EventMutations` is now injected directly through a Prisma-backed provider, owns fallback Event-code generation, and remains the single tested command boundary for versioned Event changes.

# 2026-08-28

- Fixed the Event detail **Stammdaten** form so it displays the event's selected Sportart and permits changing it through the central active-sport selection list. The existing `sportartId` now travels through the detail editing session and Event PATCH unchanged; a browser regression verifies the displayed value, submitted `sportId`, and persistence after reload.

- Implemented the selected architecture improvements: TIME2WIN sync now runs through the Event workspace with explicit progress and non-blocking failure state; TIME2WIN HTTP/auth/normalization lives behind an adapter; inactive Event roles remain available only for existing assignments; and CRM mutations consistently reload and replace the authoritative snapshot. Unit, service, and browser regressions cover the new seams.

# 2026-08-29

- Deepened the remaining Event-detail seams: intent commands now enter through one execution interface; TIME2WIN refresh returns an explicit retained-snapshot outcome for manual and scheduled runs; selection-list route mapping is a browser adapter; and the CRM lifecycle owns person-customer input shaping behind a compatibility facade. Domain, client, and event-service regression suites pass.

# 2026-08-30

- Implemented issue #38 locally: Event detail can copy an Event through an editable confirmation dialog, proposes a matching weekday in the next year while preserving multi-day duration, and supports optional chronological series links. The backend copy is transactional and excludes external/live and operational records. Focused service, workspace, and browser regressions cover the workflow.

- Recorded [GitHub issue #37](https://github.com/AndiT2W/t2w-base/issues/37) as the approved first Outlook communication slice: manual per-Event folder sync, a compact persisted Event timeline, no mail body or attachment storage, and no automatic Sent Items matching. See [Event Communication Knowledge Service](concepts/event-communication-knowledge-service.md).

- Confirmed the Eventcode Outlook-folder convention: relevant outgoing messages are moved into the Event folder, so the same manual sync covers incoming and outgoing correspondence without separately matching Sent Items.

- Implemented issue #37 locally: paginated Microsoft Graph message reads, idempotent persisted Outlook communication metadata, Event-facing Communication Hub sync, and a combined communication timeline with incoming/outgoing labels, attachment indication, Outlook deep links, repeat-sync protection, and reload persistence. Targeted unit, adapter, build, and browser regressions pass.

- Repaired the complete Event browser regression suite after issue #37: the CRM filter now imports its shared `personName` projection instead of crashing the contacts route, and TIME2WIN E2E mocks now return the real `{ kind, event }` sync outcome. The full Event-management browser suite passes 41/41.

# 2026-08-31

- Kunden- und Kontaktdetails fassen nun doppelte Zuordnungen zu einem Event zusammen und zeigen die zugehörigen Eventrollen bzw. Kundenrollen als Chips neben dem Event. Ein Browser-Regressionstest deckt beide Detailansichten ab.

# 2026-09-01

- Live-Test für `270115_mountain_attack`: Die eindeutig zugeordnete Antwort **AW: Besprechung Mountain Attack 2027** vom 27.08.2026 wurde aus `Gesendete Elemente` in den Eventcode-Ordner verschoben und anschließend erfolgreich in die Event-Kommunikation synchronisiert. Die Timeline zeigt nun fünf Einträge, darunter die ausgehende Nachricht. Grundlage für eine spätere Automatisierung ist die eindeutige Graph-`conversationId`.

- Automatisierte die getestete Zuordnung: Der Event-Kommunikations-Sync sucht gesendete Nachrichten anhand der Graph-`conversationId`, überspringt Unterhaltungen mit einer bereits bekannten Zuordnung zu einem anderen Event, verschiebt eindeutige Antworten in den Eventordner und liest ihn anschließend neu ein. Antworten sind in der Timeline sichtbar markiert und eingerückt; `Karten`, `Dialog` und `Kompakt` stehen als drei direkt vergleichbare Ansichten bereit. Service- und Browser-Regressionen decken die Zuordnung und Darstellung ab.

# 2026-09-09

# 2026-09-14

- Projektmanagement für Issue #55 auf Spezifikation v4 umgestellt: Aufgaben sind global oder eventgebunden, haben drei Status, optionale Start-/Endtage, Voraussetzungen und Kommentare. Die UI zeigt geschlossene Kategorieblöcke, aufklappbare Tabellen/Karten und eine Desktop-Gantt-Ansicht. Migration `0027_simplify_project_management` entfernt bisherige PM-Daten absichtlich; alte `EventTask`-Snapshots bleiben erhalten. Domain-, Service-, Browser- und Produktionsbuild-Prüfungen erfolgreich. Siehe [PM v4](tasks/project-management-spec-v4.md).

- Gantt-Referenz ergänzt: Die Desktopansicht verwendet nun eine fixierte Name-/Endespalte, Kalenderwochen und Tagesraster, Wochenendmarkierung, Heute-Linie und Balkenbeschriftung. Unter jedem Event gliedern Kategoriezeilen die Aufgaben. Quelle: Nutzerreferenz vom 2026-09-14.

- Importdefinition für die ClickUp-Liste `VERANSTALTUNGEN` ergänzt: ClickUp-Task-ID als externe Referenz, Stammdaten zuerst, Rollen danach, IBAN/BIC ausschließlich am Kunden-/Zahlungsempfänger-Stammsatz, keine automatische Kontaktanlage nur wegen einer IBAN, unsichere Matches in Reviewliste und zuerst Vorschau-/Idempotenzlauf. Siehe [ClickUp-Import Veranstaltungen](concepts/clickup-veranstaltungen-import.md).

- Eventserien lassen sich nun im Eventdetail nachträglich mit einem bestehenden Event verknüpfen, auf eine andere Serie verschieben oder lösen. Die transaktionale API aktualisiert die betroffenen Events versionssicher; eine Browser-Regression prüft Verknüpfen und Persistenz nach Reload.
- Spezifikation für Hardware-Verwaltung und Hardware-Rückläufer erstellt und als GitHub-Issue [#39](https://github.com/AndiT2W/t2w-base/issues/39) mit `enhancement` und `ready-for-agent` veröffentlicht. Die Umsetzung soll über ein frameworkfreies Hardware-Workspace-Modul, bestehende Event-Service-/Prisma-/API-Muster und Browser-E2E erfolgen.
- Die Grill-Session zu Issue #39 abgeschlossen: Zeilenmodell, Löschschutz, Berechtigungen, Auditierung, Pagination, Standardfilter, Europe/Vienna-Kalendertag und der Verzicht auf ClickUp-Import in V1 sind als verbindliche Entscheidungen ergänzt.
- Issue #39: Hardware-Domain, Prisma-Modell/Migration, Event-Service-CRUD mit AuditLog, zentrale Hardware-Route und Event-Hardware-Workspace ergänzt. Builds, 40 Tests und Hardware-Datei-Lint sind grün.

- Einstellungsseite erweitert: Die bestehenden Haupt-Tabs `Allgemein`, `Auswahllisten` und `Outlook` bleiben erhalten. Innerhalb von `Auswahllisten` gibt es nun ein seitliches Submenü für `Sportarten`, `Services` und `Eventrollen`; der aktive Unterbereich wird über den URL-Parameter `liste` gespeichert.

- 2026-09-09: 18 aktuelle ClickUp-Hardwaredatensätze mit Status `BENACHRICHTIGT` in die Produktionsdatenbank importiert; `eventId` bleibt bei allen Datensätzen `NULL`.

# 2026-09-09

- Variante E der Einstellungsnavigation in `t2w-base` umgesetzt: aufgeklappter Einstellungen-Bereich im globalen Sidebar-Menü; Auswahllisten-Kategorien als Segmente im Inhaltsbereich. Build und Browser-Regressionstest für Sportarten erfolgreich.
- 2026-09-09: Die Eventdetail-Stammdaten wurden im bestehenden TIME2WIN-Stil verdichtet: Eventname über die volle Breite, darunter zwei fachlich gruppierte Spalten mit Inline-Labels am Desktop; Services/Status, Archivierung und Notizen bleiben vollständig erhalten. Ein Browser-E2E-Test sichert Gruppierung und Desktop-Raster ab. Quelle: Nutzerentscheidung für Layoutvariante B vom 2026-09-09 und `src/routes/events.$eventcode.tsx`.
- 2026-09-09: Die Archivierung steht nun als kompakter Schalter direkt beim Eventnamen. Ein Browser-E2E-Test sichert die Desktop-Position. Quelle: Nutzeranfrage vom 2026-09-09 und `src/routes/events.$eventcode.tsx`.
- 2026-09-09: Sportarten und Eventrollen unterstützen nun wie Services eine persistierte Symbol-/Farbdarstellung. Einstellungen bieten Vorschau und Auswahl; die Darstellung wird auch in den Event-Auswahllisten verwendet. Quelle: Nutzeranfrage vom 2026-09-09, `src/components/t2w/ServiceBadge.tsx`, `services/event-service/prisma/migrations/0019_selection_list_presentation/migration.sql`.

## 2026-09-09

- Auszahlungsslice begonnen: Prisma-Modelle für Payout, globalen Jahresnummernkreis und AutomationClaim ergänzt; AuditService sowie geschützte CRUD-/Claim-/Result-Endpunkte angelegt.
- Zentrale Auszahlungsliste um Suche, Statusfilter, währungsgetrennte Summen, Auswahl und bestätigungspflichtige Sammelmarkierung erweitert; Browser-E2E ergänzt und erfolgreich ausgeführt.
- Generischer Automation-Claim-/Result-Vertrag mit stabilen Idempotenzschlüsseln, Retry-Projektion sowie domänenneutralen Claim-/Complete-Endpunkten ergänzt; Domain-Regressionen bleiben grün.
- ClickUp-Import wiederholbar gemacht: vorhandene `clickUpId`-Datensätze werden übersprungen statt als Fehler dupliziert; Service-Test ergänzt.
- Event-Finanzreiter-Regression erweitert: Mailmarkierung, Ausbezahlt-Status, Datumsbelegung und dauerhafte Löschung werden im Browserpfad geprüft.
- Automation-Service-Regression ergänzt: idempotente Wiederholung eines Claims sowie Completion für Payout- und Hardware-Domänen werden an der Servicegrenze geprüft.
- PayoutService fachlich gehärtet: Importstatus werden beim Erstellen übernommen, Beträge validiert/auf zwei Dezimalstellen normalisiert und Sammelmarkierungen prüfen Storno, Betrag und Mailadresse mit Einzelgründen.
- AuditLog als append-only verstärkt: PostgreSQL-Trigger verweigern UPDATE und DELETE; strukturierter AuditService-Test ergänzt.
- Echte PostgreSQL-Prüfung ausgeführt: Migration 0020 angewendet, Payout/AuditLog/AutomationClaim vorhanden; der AuditLog-Trigger weist eine UPDATE-Mutation in einer Rollback-Transaktion zurück.
- Payout-Mutationen reichen die authentifizierte Benutzer-ID bis in CREATE/UPDATE/DELETE und Sammelaktionen weiter; Service-Build und 34 Regressionstests bleiben grün.
- Echter Service-Smoke-Test gegen PostgreSQL erfolgreich: historische Auszahlung mit `eventId = null`, CHF und `T260001` angelegt, anschließend dauerhaft gelöscht; CREATE- und DELETE-Audit-Einträge wurden gelesen.
- Echter n8n-Flow gegen PostgreSQL erfolgreich: `VERSENDEN` markiert, atomar geclaimt, gleicher Idempotenzschlüssel wiederholt und Erfolg callbackt; beide Claims referenzierten denselben Datensatz und der Status wurde `GESENDET`.
- Gemeinsame Domain-Projektion für Gesamtstatus, Decimal-Normalisierung und `T260001` ergänzt. UI, Import und vollständige E2E-Abnahme stehen noch aus.

## 2026-09-09

- Auszahlungsübersicht um zentrale Statusänderung und dauerhafte Löschung erweitert; beide Aktionen verwenden die bestehenden Auditlog-Pfade.
- Dedizierte Auszahlung-Claim-Reservation gegen parallele n8n-Worker abgesichert; Event-Ansicht enthält das Auszahlungspanel nur noch im Finanzreiter.
- Verifiziert: Event-Service 35 Tests, Frontend 43 Tests, Event-Service-Build und Produktionsbuild erfolgreich. Lint bleibt wegen bereits vorhandener, breit verteilter Prettier-Verstöße außerhalb dieses Slices rot; die gezielten Auszahlung-E2E-Suites waren zuvor erfolgreich, ein erneuter Lauf wurde wegen eines bereits belegten Preview-Ports nicht gestartet.
- Generische Automation um Ergebnis-Callback (`SUCCESS`/`FAILED`, Fehler, Retry-Zähler, externe ID und Zeitstempel) erweitert; Prisma-Migration `0021_automation_claim_results` ergänzt.
- Zentrale Auszahlungsliste um explizite Filterparameter für Event, Jahr und Empfänger sowie die Spalte Transaktionsbestätigung ergänzt; Route formatiert und separat geprüft.
- Filter als echte Event-/Empfänger-Auswahllisten umgesetzt; E2E verifiziert die Jahresfilter-Anfrage.
- Zentrale Neuanlage mit Eventauswahl, Währung und Empfänger-Mailvorbelegung ergänzt; Produktionsbuild erfolgreich.
- E2E-Fixture auf vollständige Eventprojektion umgestellt; zentrale Neuanlage und beide Auszahlungsszenarien laufen wieder erfolgreich.
- Generischer Hardware-Claim reserviert `MAIL_SEND` atomar als `NOTIFIED`; Fehler-Callback setzt auf `MAIL_SEND` zurück und aktualisiert Claim-Ergebnis/Retry-Daten.
- Auch der generische Auszahlung-Claim reserviert nun per konditionalem Update; fehlgeschlagene Claim-Erstellung gibt die Reservation zurück.
- Statusregeln verschärft: `AUSBEZAHLT` erhält automatisch ein `paidAt`; `GESENDET` kann nur noch über den bestätigten Automation-Ergebnisweg gesetzt werden.
- ClickUp-Import löst nun stabile Eventcodes gegen lokale Events auf; unbekannte Codes bleiben reproduzierbar mit `eventId = null` und Review-Markierung. Regressionstest ergänzt.
- Reproduzierbares CLI-Importwerkzeug für ClickUp-JSON ergänzt; Vorschau ist Standard, Produktivlauf erfordert explizit `--commit`. Kein echter Export war im Repository vorhanden.
- Versandfreigabe aktualisiert Empfängersnapshot und tatsächliche Mailadresse nochmals aus den aktuellen Stammdaten; damit ist der Snapshot spätestens bei `VERSENDEN` aktuell.
- Vollständiger Auszahlungstestlauf erneut verifiziert: beide Browser-E2E-Szenarien bestanden, Event-Service 37 Tests bestanden; Issues #41–#48 bleiben bewusst offen, da Produktivimport/Abnahme noch nicht vollständig belegt sind.
- Event-Finanzreiter zeigt den tatsächlichen Empfängernamen aus dem gespeicherten Auszahlungssnapshot; Event-E2E und Service-Suite erneut erfolgreich.
- Generischer Claim-Vertrag explizit für die Domäne `invoice` getestet; weitere Domänen können ohne Schemaänderung über denselben Idempotenzschlüssel verarbeitet werden.
- ClickUp-Betragsnormalisierung unterstützt nun deutsche und internationale Tausender-/Dezimaltrennzeichen; zwei Regressionen ergänzt.
- Zentraler geschützter Audit-Leseendpunkt `/api/v1/audit-log` ergänzt; Filter nach Entität und Datensatz sind möglich.
- Zentrale Auszahlungsliste erlaubt nun Inline-Bearbeitung von Betrag und Transaktionsbestätigung; E2E prüft die PATCH-Persistenz.
- Statusinvarianten mit eigenem `payout.service.spec.ts` abgesichert: automatische `paidAt`-Vergabe und Schutz vor gefälschtem `GESENDET`-CRUD-Übergang.
- 2026-09-09: Hardware-Seite gegen `event = null` abgesichert. Ursache war ein direkter Zugriff auf `i.event.eventCode` bei verwaisten Hardware-Datensätzen; Regressionstest in `tests/e2e/hardware.spec.ts` ergänzt, relevante Playwright-Tests bestanden.
- 2026-09-09: Mail- und Zahlungsstatus von Auszahlungen sind in Event-Finanzreiter und zentraler Übersicht unabhängig manuell auswählbar; der bisherige CRUD-Schutz für `GESENDET` wurde entfernt. Service- und Browser-Regression ergänzt.
- 2026-09-09: Mehrbenutzersystem verbindlich beschlossen: interne Benutzer in einer Organisation, `Admin`/`Benutzer`, E-Mail-/Passwort-Login, Einladung, Deaktivierung statt Löschung, serverseitige Rechteprüfung, Auditierung und `.env`-Bootstrap des ersten Admins.
- 2026-09-09: Spezifikation für das interne Mehrbenutzersystem erstellt und als GitHub-Issue #49 mit `enhancement` und `ready-for-agent` veröffentlicht.
- 2026-09-10: Ticket #55 erweitert: Aufgaben im Event-Detail bekommen optionale Abhängigkeitsbeziehung (`dependsOnTaskId`) mit Backend-Read/Write im Event-Task-Pfad (`Task`-Schema, API, Domain-Command, Transport), plus Inline-UI für Blocker-Auswahl und Sperrlogik beim Erledigen. Quellen: `services/event-service/prisma/schema.prisma`, `services/event-service/src/events.controller.ts`, `services/event-service/src/event-mutations.ts`, `services/event-service/src/prisma-event-mutation.adapter.ts`, `src/lib/t2w/api.ts`, `src/lib/t2w/types.ts`, `src/routes/events.$eventcode.tsx`, `services/event-service/prisma/migrations/0006_task_dependencies/migration.sql`.
- 2026-09-10: Ticket #55 Folge-Slice: Task-Abhängigkeiten sind jetzt beim Schreiben validiert (gleiche Event-ID, keine Selbst-Abhängigkeit, kein Zykel). Neu kann zusätzlich bei der Erstausgabe eine Abhängigkeit gesetzt werden (`newTaskDependency`). Quelle: `services/event-service/src/prisma-event-mutation.adapter.ts`, `src/lib/t2w/event-detail-workspace.ts`, `src/routes/events.$eventcode.tsx`.

# 2026-09-09

- 2026-09-10: Der Löschdialog im Eventdetail übergab seine Mutationen versehentlich als zweites Argument an `useState`; dadurch war `mutations.remove` nicht vorhanden und kein `DELETE`-Request wurde ausgelöst. Die Mutationen werden nun korrekt an `createEventDetailWorkspace` übergeben. Ein Browser-E2E-Test prüft Bestätigung, API-DELETE und Rückkehr zur Übersicht; Produktions-Build erfolgreich. Quellen: `src/routes/events.$eventcode.tsx`, `tests/e2e/event-detail-ux.spec.ts`.

- 2026-09-10: Hardware-Lebenszyklus hinter ein gemeinsames Intent-Modul für zentrale und Event-Detailansicht gelegt. Hardware- und Auszahlungsmutationen verwenden nun den transaktionalen Audit-Seam; fokussierte Client-/Service-Regressionen sowie Event-Service- und Produktions-Build bestanden. Quelle: `src/lib/t2w/hardware-lifecycle.ts`, `services/event-service/src/audit.service.ts`, Nutzerentscheidung vom 2026-09-10.

- Finanz-Reiter auf Variante 1 umgestellt: Auszahlungsempfänger und Rechnungsempfänger sind als kompakte getrennte Bereiche angeordnet; Auszahlungen nutzen eindeutige Status-Badges und gebündelte Aktionen statt mehrfacher Status-Dropdowns. KPI-Karten wurden bewusst nicht übernommen. Typecheck/Script nicht vorhanden; Domain-Build, Lint, Vitest (44 Tests) und Produktions-Build erfolgreich.
- Finanz- und Kontakte-Reiter um je ein persistentes, tab-spezifisches Notizfeld ergänzt (`financeNotes`, `contactsNotes`), inklusive Prisma-Migration und Browser-Regression für Speicherung.
- Event-Löschen ergänzt: bestätigte Löschaktion in Desktop- und Mobilliste, `DELETE /api/v1/events/:id` mit serverseitigem Aufräumen abhängiger Daten sowie Regressionstest im Event-Workspace.
- 2026-09-09: Auditlog als eigene Einstellungsseite mit Entitätsfilter, zentraler API-Anbindung und Browser-Regressionstest ergänzt.
- 2026-09-09: Deploy-Reihenfolge korrigiert: Event-Service startet erst nach erfolgreichem Prisma-Migrationslauf, damit neue Prisma-Clients während des Deployments keine 500er wegen fehlender Datenbankspalten ausliefern.
- 2026-09-09: Auswahllisten erweitert: Hinzufügen steht oberhalb der Einträge, Reihenfolge per Drag & Drop mit sortOrder speicherbar; Hardware nutzt nun ebenfalls Symbol- und Farbdarstellung.
- 2026-09-09: Eventdetail-UX für Issues #50–#53 umgesetzt: responsive Tab-Navigation mit mobilem „Mehr“-Menü, Dirty-/Loading-Feedback beim Speichern, verständlicher Outlook-Quartals-Hinweis und eingeklappter Gefahrenbereich mit Bestätigungsdialog. Fokussierte Regression in `tests/e2e/event-detail-ux.spec.ts` (4 Tests) und Development-Build erfolgreich.
- 2026-09-10: Ressourcen-Navigation zu einem geordneten vollständigen Darstellungsmodell vertieft; Dashboard, Veranstaltungsübersicht, mobile Liste und Eventdetail verwenden denselben Seam. Audit-Log-Browsing in einen Workspace für Laden, Entitätsfilter, Suche, Fehlererhalt, Schutz vor verspäteten Antworten und CSV-Projektion verschoben. Quellen: `src/lib/t2w/folder-navigation.ts`, `src/lib/t2w/audit-log-workspace.ts` und Nutzerentscheidungen vom 2026-09-10.
- 2026-09-10: Absturz des Event-Finanzreiters behoben. `payout-workspace.snapshot()` erzeugte bei jedem Lesen eine neue Referenz und löste über `useSyncExternalStore` eine React-Endlosschleife aus. Der Workspace publiziert Snapshots nun nur bei Zustandsänderungen; Unit- und Finanz-Browser-Regression sichern den Vertrag. Quellen: `src/lib/t2w/payout-workspace.ts`, `src/lib/t2w/payout-workspace.test.ts`, Produktionsreproduktion am Event `270801_ostseeman`.
- 2026-09-10: Event-Kommunikation für große Nachrichtenbestände verdichtet. Die kompakte Listenansicht ist Standard; Betreff und Adressen werden kontrolliert gekürzt, Vorschauen auf eine Zeile begrenzt und Abstände reduziert. Expansion, Kontaktstatus, Richtung, Anlagen und Outlook-Link bleiben erhalten. Browser-Regression deckt Standardansicht und Vorschau ab. Quellen: `src/routes/events.$eventcode.tsx`, `tests/e2e/event-management.spec.ts`, Live-Prüfung am Event `260904_ultraks_mayrhofen_2026`.
- 2026-09-10: Hardware-Übersicht visuell und operativ verdichtet: beschriftete Filter, aktiver Ergebniszähler, Filter-Reset, leerer Ergebniszustand, lokale Datumsdarstellung sowie klar markierte überfällige Vorgänge. `tests/e2e/hardware.spec.ts` sichert den Resetpfad; die Hardware-Playwright-Suite (3 Tests) und das gezielte ESLint liefen erfolgreich. Quellen: `src/routes/hardware.tsx`, `tests/e2e/hardware.spec.ts`, Live-Prüfung der Produktivansicht am 2026-09-10.
- 2026-09-10: Durchgängiger Hardware-Anlege-Sheet neben dem bestehenden Tabellen-Inline-Editing spezifiziert und als Issue #54 veröffentlicht. Der Browser-E2E-Workflow ist der gemeinsame Test-Seam. Quelle: [Issue #54](https://github.com/AndiT2W/t2w-base/issues/54), Nutzerentscheidung vom 2026-09-10.

## 2026-09-10 — Integriertes Projektmanagement spezifiziert

Nutzerauftrag und vorhandene EventTask-, Serien-, Kommunikations-, Benutzer- und Auditstruktur ausgewertet. [Vollständige Spezifikation](tasks/project-management-spec.md) mit Fachregeln, UX, Datenmodell, API-Verträgen, Migration und 30 Akzeptanzkriterien erstellt. Versionierte Serienvorlagen und Event-Löschschutz sind vorgeschlagene Erweiterungen; keine Produktimplementierung. [Konversationsquelle](sources/2026-09-10-user-project-management.md) und Wiki-Navigation ergänzt.

## 2026-09-10 — Projektmanagement-Spezifikation v2

Die überarbeitete [Spezifikation v2](tasks/project-management-spec-v2.md) trennt nach überprüftem Ist-Stand ausdrücklich Task-, Liefer- und Risikozustände, ergänzt Zielmodell, API, Transaktionen, Historienerhalt, Migration, Tests und einen inkrementellen MVP-Schnitt. Sie verweist für jede Bestandsaussage auf Repository-Evidenz; es wurde keine Produktimplementierung vorgenommen.

### Bestätigte MVP-Schärfung

Die Spezifikation wurde nach einer Grill-Session präzisiert: MVP mit vier Arbeitsstatus, `NORMAL`/`HIGH`, berechneter nicht blockierender Überfälligkeit, administrierbaren Gruppen, ClickUp-artigem Aktivitätslog und rein lesendem n8n-Service-Token. Risiken, Red Flags, Blocker, Abhängigkeiten, Kommentare, Kanban und Kalender sind bewusst spätere Inkremente. Legacy-Checkboxaufgaben werden nach einem auditierbaren Snapshot entfernt statt migriert. Quelle: Nutzerentscheidungen vom 2026-09-10.

- Die bestätigte MVP-Spezifikation als GitHub-Issue [#55](https://github.com/AndiT2W/t2w-base/issues/55) mit `enhancement` und `ready-for-agent` veröffentlicht. Kein Produktcode geändert.

- 2026-09-10: Alle Modul- und Eventseiten verwenden im gemeinsamen Seitenkopf nun den Breadcrumb `Übersicht > …`; die Übersichtsseite zeigt keinen Produktnamen im Breadcrumb. Die Kunden-/Kontaktseite erläutert zusätzlich die Fachgrenze: Kontakte sind Personen/Ansprechpersonen, Kundenprofile dienen Organisationen und Abrechnung. Quellen: `src/components/t2w/PageHeader.tsx`, `src/routes/kontakte.tsx`, `src/routes/veranstaltungen.tsx`, [Entscheidung Person, Kundenprofil und Eventrollen](decisions/2026-08-21-person-kundenprofil-und-eventrollen.md).
- 2026-09-10: Das Hardware-Anlegeformular von Platzhalter-/Dreispaltenlayout auf klar beschriftete, gruppierte Zwei-Spalten-Abschnitte umgestellt. Empfänger, Ausgabe und Details bleiben auch bei Nummernbereichen nachvollziehbar; die Event-Hardware-E2E sichert die sichtbaren Abschnitte und Felder. Quellen: `src/components/t2w/HardwareWorkspace.tsx`, `tests/e2e/hardware.spec.ts`, Nutzerreferenz auf den Kontakt-Dialog vom 2026-09-10.

## 2026-09-10 — Kategorie-Readiness spezifiziert

Pflichtquellen und Issue #55 gelesen, visuelle Referenz geprüft. [Readiness-Ergänzung](tasks/project-management-readiness-spec.md) mit Hybridvergleich, exakter Zustandsableitung, neutralen Wissenslücken, manuellen Nachweisen statt pauschaler Grün-Übersteuerung, Prozessketten und Fachmodulgrenzen erstellt. Informationsarchitektur auf bestehendes Eventlayout und globale Route ausgerichtet; 24 Browser-Abnahmeszenarien einschließlich Reload-Persistenz spezifiziert. Prüfpunkte im ersten Umfang bleiben eine offene Produktentscheidung. [Nutzerquelle](sources/2026-09-10-user-event-readiness.md), Glossar und Navigation aktualisiert; Widersprüche zu v2/Issue sichtbar dokumentiert. Kein Produktcode und kein GitHub-Issue verändert; keine Produkttests ausgeführt.

## 2026-09-10 — Drei Readiness-Designvorschläge

Auf Nutzerauftrag drei interaktive Gesprächsentwürfe mit identischen Beispieldaten erstellt: ruhige Bereichsübersicht, handlungsorientiertes Briefing und Kategorien mit Arbeitsbereich. [Designvergleich](tasks/project-management-readiness-designs.md) dokumentiert Vorteile und Abwägungen; Empfehlung A, Auswahl offen. Bestehender Eventrahmen bleibt erhalten; Lieferkette als späteres Zielbild. Keine Produktimplementierung oder Produkttests; Prüfpunkte im ersten Umfang weiterhin nicht bestätigt.

## 2026-09-10 — Generische PM-Abläufe diskutiert

Auf Nutzerfrage [generische Abläufe](tasks/project-management-generic-workflows.md) als unbestätigten Ausbau dokumentiert: frei benannte fachliche Schritte, gemeinsame Aufgabenstatus, eindeutige Nachweisquelle und eventinterne Ende-zu-Start-Voraussetzungen. Planmäßiges Warten erzeugt keinen Handlungsbedarf; tatsächliche Fachereignisse und Historien werden nicht zurückgesetzt. Bestehender MVP bleibt unverändert; keine Implementierung.

## 2026-09-10 — Aufgabenketten mit aufklappbarer Tabelle

Nutzervorschlag als bevorzugte Diskussionsrichtung im [Ablaufkonzept](tasks/project-management-generic-workflows.md) ergänzt: direkte Task-Abhängigkeiten bilden die Übersicht, Klick öffnet dieselben Aufgaben tabellarisch. Interaktiver Gesprächsentwurf erstellt. Verzweigungen, unabhängige Aufgaben und Aussagegrenze einer rein aufgabenbasierten Readiness festgehalten. Kein zusätzliches Schrittmodell beschlossen, keine Implementierung.

## 2026-09-10 — Issue #55 auf PM-Spezifikation v3 aktualisiert

Mit dem ausdrücklich aufgerufenen to-spec-Skill [v3](tasks/project-management-spec-v3.md) synthetisiert und im bestehenden [Issue #55](https://github.com/AndiT2W/t2w-base/issues/55) veröffentlicht: direkte Aufgabenabhängigkeiten, abgeleitete Ablaufübersicht, darunter aufklappbare Aufgabentabelle; vier Arbeitsstatus und berechnete Voraussetzungen. 44 User Stories, 19 Browser-Abnahmen für den Erstumfang, getrennte spätere Liefer-/Vorlagen-/n8n-Inkremente. Titel/Body und Labels enhancement/ready-for-agent nach dem Schreiben vollständig geprüft. Ursprünglichen Issue-Stand unter raw gesichert, ältere Spezifikationen als abgelöst verlinkt; [Quellennachweis](sources/2026-09-10-project-management-spec-v3.md). Kein Produktcode implementiert.

Parallel gemeldete Inline-Vorschau auf natives details/summary ohne eigene Scripts oder Host-Tweak-Aufrufe vereinfacht. Lokale Playwright-Prüfung im sandboxed iframe: Klick/Enter/Space, vier Tabellenzeilen und äußere Breite bei Desktop/Mobil erfolgreich. Interner MCP-Renderer-Timeout nicht direkt reproduzierbar; erneute Inline-Auslieferung bleibt vom Host abhängig.

## 2026-09-10 — Issue #55 zurückgenommen und neu implementiert

Auf ausdrücklichen Nutzerauftrag die vorherige Checkbox-/Einzelvorgänger-Implementierung zurückgenommen; Spezifikation und Quellen erhalten. Neue PM-Domain, transaktionale API, Aufgaben-/Abhängigkeitsmodell, Kategorien-/Ablaufansicht, globale Cursoransicht, Verlauf/Audit, Fachreferenzen, Rechte-/Historienregeln und geprüfter Legacy-Snapshot umgesetzt. Alte falsch einsortierte Migration entfernt; neue Migrationen auf einer frischen lokalen PostgreSQL-Datenbank geprüft. Kein Deployment oder produktiver Cutover.

Prüfung: 8 echte PM-Browsertests, 53 Workspace-, 25 Domain- und 48 Service-Tests bestanden; Produktionsbuild und Lint der geänderten Dateien erfolgreich. Mobile-/Konfliktablauf nach letzter Layoutkorrektur sowie aktualisierte Navigations-/Sprachtests erneut erfolgreich. 11 verbleibende Fehler der bestehenden Mock-Browser-Suite am Ausgangscommit `ed49c5ca` reproduziert. Strenger Frontend-Typecheck: 197 bestehende Diagnosen, keine neuen gegenüber der Vergleichsbasis (199). Zwei Reviewachsen durchlaufen; konkrete Korrektheitsbefunde korrigiert. [Implementierung, Betrieb und Testgrenzen](tasks/project-management-implementation.md).

## 2026-09-10 — Deploy-Overlay korrigiert

Der fehlgeschlagene GitHub-Deploy von Commit `f114bac3` baute eine im aktuellen Repository entfernte Testdatei auf dem Server weiter. Ursache: `git archive` enthält keine Löschmarkierungen; das bisherige Entpacken über den bestehenden Deployment-Pfad ließ entfernte Dateien zurück. Der Workflow entpackt das Archiv nun zunächst in ein geprüftes temporäres Verzeichnis und ersetzt anschließend den Release-Inhalt, während die deployment-spezifische `.env` erhalten bleibt. Ein isolierter Test bestätigt, dass eine veraltete Datei entfernt und `.env` bewahrt wird. Lokaler App-Build sowie Prisma-Generierung, 44 Event-Service-Tests und Event-Service-TypeScript-Build sind erfolgreich. Quelle: `.github/workflows/deploy-hostinger.yml`, GitHub Actions Lauf `34533212753`.

## 2026-09-15 — Aufgabenplanung und Tabellen vertieft

Nach bestätigtem Architektur-Review ist `projectTaskFlows` die kanonische Aufgabenablaufprojektion: verbundene Aufgaben behalten parallele Stufen, unabhängige Aufgaben sind getrennte Abläufe. Das gemeinsame `TaskDetailSheet` ersetzt die doppelte Detailinteraktion in Event- und Gesamtansicht bei erhaltener Event-Graph-Version. `DataTable` bündelt nun Struktur, Tastaturfokus und Tabellenverhalten für Übersicht, Veranstaltungen, Hardware, Auszahlungen und beide Aufgabenlisten. Domain-, Workspace- und PM-Browser-Tests sowie der Produktionsbuild sind erfolgreich. Details: [Aufgabenplanung und Tabellen-Vertiefung](concepts/task-planning-and-table-deepening-2026-09-15.md).

## 2026-09-15 — Dichte Inhaltsseiten (Variante A) umgesetzt

Auf Nutzerentscheidung bleibt die linke Navigation unverändert; die Inhaltsseiten nutzen mehr Arbeitsbreite und verdichten Kopf, Kennzahlen, Filter und Tabellen. Die globale Aufgabenübersicht zeigt alle gefilterten Aufgaben unmittelbar in einer kompakten Tabelle und behält Detail-Sheet, Filter, Gantt und mobile Karten bei. Übersicht, Veranstaltungen, Kontakte, Hardware, Auszahlungen und Einstellungen folgen derselben Hierarchie. Die PM-Browser-Regression wurde auf den direkten Tabellenablauf aktualisiert; ihr Lauf ist lokal ohne gesetzte `PM_TEST_DATABASE_URL` nicht startbar. Lint und Produktionsbuild sind erfolgreich. Quellen: `src/routes/aufgaben.tsx`, `src/routes/index.tsx`, `src/routes/veranstaltungen.tsx`, `src/routes/kontakte.tsx`, `src/routes/hardware.tsx`, `src/routes/auszahlungen.tsx`, `src/routes/einstellungen.tsx`, `tests/pm-e2e/project-management.spec.ts`.

## 2026-09-15 — Datumsformat vereinheitlicht

Alle sichtbaren Datumswerte werden über den gemeinsamen Formatierungsseam als `dd.mm.yyyy` ausgegeben; bei Zeitstempeln folgt die Uhrzeit nach dem Datum. Zeiträume zeigen beide Endpunkte vollständig. ISO-Werte bleiben unverändert für API, Filter und native Datumseingaben. Unit- und Browser-Regressionen sichern die zentrale Formatierung sowie exemplarisch Veranstaltungs- und Hardwaretabellen. Quellen: `src/lib/t2w/format.ts`, `src/lib/t2w/format.test.ts`, `tests/e2e/event-management.spec.ts`, `tests/e2e/hardware.spec.ts`.

## 2026-09-15 — ClickUp-Veranstaltungen importiert

Die Live-Liste `TIME2WIN > Office > VERANSTALTUNGEN` mit 756 Hauptaufgaben als Rohquelle erfasst. Migration `0030_clickup_event_import` ergänzt die eindeutige `Event.clickUpId` sowie `EventClickUpSource` für den vollständig erhaltenen Quellstand. Der Import upsert über die ClickUp-ID und legte 756 Events ohne Fehler an; alle 756 Quellen sind eindeutig verknüpft, 494 enthalten zusätzlich eine Detailantwort. 500 Detailantworten und die vollständige Listenantwort sind als Evidenz abgelegt. Service-Regressionen und die Validierung des kompletten 756er-Quellstands liefen erfolgreich. Siehe [Quellnachweis](sources/2026-09-15-clickup-live-veranstaltungen.md) und [Importkonzept](concepts/clickup-veranstaltungen-import.md).

Korrektur: Die ClickUp-ID bleibt ausschließlich im technischen Feld `clickUpId` und ist auf der Stammdaten-Seite nicht sichtbar. Da die Quelle keinen eigenen Slug liefert, ersetzt die Rückmigration die ehemaligen `clickup-<id>`-Platzhalter mit der bestehenden `YYMMDD_slug`-Konvention; bereits manuell gesetzte Codes bleiben geschützt.

## 2026-09-15 — Produktionsabsturz der Aufgabenübersicht diagnostiziert

Der React-Absturz auf `/aufgaben` wurde gegen die Live-Seite und ihre ausgelieferten Chunks reproduziert. Die Route übergab `interaction.getSnapshot` an `useSyncExternalStore`, während der Task-Interaction-Workspace nur `snapshot()` bereitstellt. Der bereits korrigierte lokale Arbeitsstand verwendet den gültigen Vertrag; gezielter PM-Browsertest und Produktionsbuild sind erfolgreich. Produktion blieb zum Diagnosezeitpunkt auf dem fehlerhaften Bundle und benötigt einen neuen Deploy. Details: [Produktionsabsturz der Aufgabenübersicht](sources/2026-09-15-aufgaben-produktionsabsturz.md).

## 2026-09-15 — Einzelzellenbearbeitung für kompakte Tabellen entschieden

Für das Inline-Editing der Hardwaretabelle ist ein ClickUp-artiges Zellmodell festgelegt: Nur eine Zelle wird zum Editor, während `Tab` speichert und zur nächsten bearbeitbaren Zelle derselben Zeile wechselt; `Shift+Tab` navigiert rückwärts und `Escape` verwirft. Damit bleiben die Spaltenbreiten stabil und der schnelle Tastaturfluss erhalten. Die Entscheidung ist im Konzept [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md) festgehalten; noch keine Produktimplementierung.

## 2026-09-15 — Kontrast der Tabellenköpfe als offene Anforderung erfasst

Nutzerfeedback bewertet das UI insgesamt und besonders die Tabellenköpfe als zu kontrastarm. Die Prüfung des gemeinsamen Tabellenprimitives bestätigt eine nur sehr schwache Flächentrennung zwischen Header und Tabellenkörper; als Ziel sind eine deutlichere Headerfläche, dunklere Beschriftung und eine klarere Unterkante dokumentiert. Noch keine Produktimplementierung. Quelle: Nutzerkonversation vom 2026-09-15 und [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## 2026-09-15 — Ausgewogene Tabellenkopf-Kontraste umgesetzt

Die bestätigte neutrale Variante ist nun für gemeinsame und fachliche Tabellen umgesetzt: weißer Tabellenkörper, neutralgrauer Kopf, dunkle 12-px-Beschriftung ohne Versalsatz und eine 2-px-Unterkante. Semantische Light-/Dark-Mode-Tokens und der Styleguide halten die Darstellung zentral fest. Der gezielte Browser-Regressionstest, Lint der betroffenen Dateien und der Produktionsbuild sind erfolgreich. Quellen: `src/styles.css`, `src/components/t2w/DataTable.tsx`, `src/components/ui/table.tsx`, `src/routes/styleguide.tsx`, `tests/e2e/table-preferences.spec.ts` und [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## 2026-09-15 — TIME2WIN-Event-ID in Stammdaten änderbar

Das TIME2WIN-ID-Feld in den Event-Stammdaten war schreibgeschützt. Es ist nun eine ganzzahlige Eingabe und wird mit dem bestehenden Stammdaten-Speichern persistiert. Der E2E-Test prüft die Änderung eines vorhandenen Werts und dessen Erhalt nach Reload. Die frühere Festlegung zum ausschließlichen Pflegeort im TIME2WIN-Reiter ist für die ID abgelöst. Details: [Entscheidung](decisions/2026-09-15-time2win-event-id-in-stammdaten.md), [Implementierung](../src/routes/events.$eventcode.tsx), [Browser-Regression](../tests/e2e/event-management.spec.ts).

## 2026-09-15 — Statusspalte der Eventtabellen verdichtet

Übersicht und Veranstaltungsansicht zeigen in der Statusspalte nur den farbigen Punkt. Die Spalte ist auf 3 rem begrenzt und zeigt im Sortierkopf `St.` bei erhaltenem zugänglichem Namen `Status sortieren`. Der volle Status ist pro Zelle für Screenreader verfügbar. Ein E2E-Test sichert die Breite und Statusbeschriftung in beiden Ansichten. Quellen: `src/routes/index.tsx`, `src/routes/veranstaltungen.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — TIME2WIN-Backend-Link in Eventtabellen

Übersicht und Veranstaltungsansicht zeigen eine TIME2WIN-Logo-Spalte. Eine vorhandene Event-ID wird als Link zum Backend-Event angezeigt; ohne ID bleibt die Zelle ohne Backend-Link. Browser-Regressionen prüfen Ziel-URL und den Leerzustand in beiden Ansichten. Quellen: `src/routes/index.tsx`, `src/routes/veranstaltungen.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Event-Reiter in ANMELDUNG umbenannt

Der bisher als `TIME2WIN` beschriftete Reiter im Event-Workspace heißt sichtbar nun `ANMELDUNG`. Die technische Tab-ID und die TIME2WIN-Bezeichnungen innerhalb des Bereichs bleiben unverändert. Die bestehenden Browser-Workflows öffnen den Bereich über die neue Beschriftung. Quellen: Nutzerkonversation vom 2026-09-15, `src/routes/events.$eventcode.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Überschneidende Eventtermine farblich gruppiert

Die Veranstaltungsansicht gruppiert Events ausschließlich nach demselben Startdatum in der aktuell gefilterten Liste. Seit der Präzisierung aus der Nutzerkonversation vom 2026-09-16 nehmen nur Events mit dem Service `Active` oder `UHF` an Gruppierung und Zähler teil; Events mit ausschließlich anderen oder ohne Services bleiben unmarkiert. Zwei abwechselnde, dezente Farben markieren die Gruppen; ein sichtbares `2×`-/`3×`-Kennzeichen, die Legende und zugängliche Hinweise ergänzen die Farbcodierung. Mehrtägige Events markieren keine später startenden Events mehr. Reine Logiktests sichern gleiche Starttage, die Servicegrenze und die Abgrenzung langer Zeiträume; ein Browser-Test prüft Gruppierung, Zähler, ausgeschlossene Services, berechnete Farbe, Legende und mobile Karten. Quellen: `src/lib/t2w/event-date-collisions.ts`, `src/components/t2w/EventDateCollision.tsx`, `src/routes/veranstaltungen.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Veranstalter mit Kundendatensätzen verlinkt

Alle reinen Veranstalter-Anzeigen in Übersicht, Veranstaltungsliste, mobiler Eventkarte, Angeboten, Rechnungen und Eventkopf führen bei vorhandener Veranstalter-ID dezent zum zugehörigen Kunden-Datensatz. Ohne ID bleibt der Name unverlinkter Text. Der gemeinsame Link besitzt Tastaturfokus; eine Browser-Regression prüft alle Ansichten und öffnet den referenzierten Kundendatensatz. Produktionsbuild, Lint, 60 Unit-Tests und der gezielte Browser-Test sind erfolgreich. Quellen: `src/components/t2w/OrganizerLink.tsx`, `src/components/t2w/EventMobileList.tsx`, `src/routes/index.tsx`, `src/routes/veranstaltungen.tsx`, `src/routes/angebote.tsx`, `src/routes/rechnungen.tsx`, `src/routes/events.$eventcode.tsx`, `tests/e2e/event-management.spec.ts` und Nutzerkonversation vom 2026-09-15.

## 2026-09-15 — Statusauswahl in Event-Stammdaten vereinheitlicht

Das Status-Auswahlfeld der Event-Stammdaten zeigt den gewählten Wert und alle Optionen mit dem bestehenden farbigen Statuspunkt und einer Textbeschriftung. Die Farbe stammt aus derselben zentralen Statusdarstellung wie Badges und Tabellenpunkte; der Text verhindert eine rein farbliche Codierung. Der gezielte Browser-Regressionstest, Lint und Produktionsbuild sind erfolgreich. Quellen: Nutzerkonversation vom 2026-09-15, `src/components/t2w/StatusBadge.tsx`, `src/routes/events.$eventcode.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Eventserien per Mehrfachauswahl pflegbar

Der Eventdetail-Dialog verbindet nun mehrere ausgewählte Termine in einem atomaren Speichervorgang. Das geöffnete Event ist automatisch enthalten, bestehende Serienmitglieder sind vorausgewählt und bewusst abgewählte bisherige Mitglieder werden gelöst. Oberhalb des Event-Workspace erscheinen der chronologisch vorherige und nächste Termin als beschriftete, klickbare Badges. Service- und Workspace-Unit-Tests, Frontend- und Event-Service-Build sowie der gezielte Browserworkflow mit drei Events und Reload sind erfolgreich. Quellen: Nutzerkonversation vom 2026-09-15, [Eventserie](concepts/event-copy-and-series.md), `services/event-service/src/event-mutations.ts`, `src/routes/events.$eventcode.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Kundenstamm mit Rechnungsbestand abgeglichen

Die bestehende Importarbeitsmappe mit 114 Kunden und 146 zugeordneten Rechnungsbelegen wurde gegen alle 164 PDFs unter `raw/03_rechnungen/` abgeglichen. Der neue Stand enthält 123 Kunden; 18 Belege wurden ergänzt, vier Dublettenzeilen über UID beziehungsweise identische Anschrift und Kontakt zusammengeführt und die frühere Fehlzuordnung der TIME2WIN-UID bereinigt. Alle 164 Belege sind genau einmal zugeordnet. Fehlende oder abgeleitete Angaben aus den Rechnungen 260087 und 260161 bleiben ausdrücklich markiert. Ergebnis und Evidenz: [Rechnungen-Kundenstamm-Abgleich 2026](sources/2026-09-15-rechnungen-kundenstamm-abgleich.md).

## 2026-09-15 — Abgeglichener Kundenstamm produktiv importiert

Der Rechnungs-Kundenstand wurde transaktional in die Hostinger-Produktionsdatenbank des `t2w-base`-Event-Service importiert. 109 bestehende Organisationen wurden mit den geprüften Rechnungsdaten ergänzt oder korrigiert, 14 neue Kunden angelegt und 20 Kontakte neu verknüpft. Der Import korrigiert 14 frühere Zeichenfehler in Kundennamen, ohne Dubletten anzulegen; 123 Rechnungs-Kunden sind eindeutig aufgelöst und 106 Primärkontakte gesetzt. Vorher wurde ein vollständiger PostgreSQL-Dump erstellt; Pfad und angewandtes SQL sind in [Rechnungen-Kundenstamm-Abgleich 2026](sources/2026-09-15-rechnungen-kundenstamm-abgleich.md) dokumentiert.

## 2026-09-15 — Datumsbereich in Event-Stammdaten verdichtet

Start- und Enddatum stehen im Stammdatenbereich eines Events nun als zwei gleich breite Datumsfelder in einer gemeinsamen Zeile mit sichtbarem Trennstrich. Die Feldgruppe ist insgesamt genauso breit wie die angrenzenden Einzelfelder, bleibt auch in der schmalen Ansicht einzeilig und besitzt weiterhin getrennte zugängliche Feldbezeichnungen. Der Browser-Regressionstest prüft Ausrichtung und Breite auf Desktop und bei 390 px. Quellen: Nutzerkonversation vom 2026-09-15, `src/routes/events.$eventcode.tsx`, `src/lib/i18n.tsx`, `tests/e2e/event-management.spec.ts`.

## 2026-09-15 — Excel-Export für alle Datentabellen

Der gemeinsame `DataTable`-Vertrag verlangt nun einen fachlichen Exportnamen und stellt an jeder Tabelle einen beschrifteten Excel-Export bereit. Die `.xlsx`-Arbeitsmappe entspricht dem sichtbaren, gefilterten und sortierten Tabellenstand; Auswahl- und Aktionsspalten werden ausgelassen. Bestehende fachliche Tabellen in Übersichten, Stammdaten, Hardware, Auszahlungen, Angeboten/Rechnungen, Auditlog und Eventdetails wurden auf den gemeinsamen Vertrag geführt. Der Auditlog behält den CSV-Export zusätzlich. Die Browser-Regression lädt eine Arbeitsmappe herunter und validiert ihre Kopfzeile sowie Eventdaten. Quellen: Nutzerkonversation vom 2026-09-15, `src/components/t2w/DataTable.tsx`, `tests/e2e/table-preferences.spec.ts` und [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## 2026-09-16 — TIME2WIN-Spalte der Eventtabellen neu positioniert

In Übersicht und Veranstaltungsansicht steht die TIME2WIN-Spalte nun direkt zwischen Status und Event. Kopf und Zellen sind auf 3,5 rem begrenzt; Logo, Sortierung und Backend-Link bleiben erhalten. Der Excel-Export folgt derselben Reihenfolge. Browser-Regressionen prüfen Position, Breite, Linkziel und Exportkopf. Quellen: Nutzerkonversation vom 2026-09-16, `src/routes/index.tsx`, `src/routes/veranstaltungen.tsx`, `tests/e2e/event-management.spec.ts`, `tests/e2e/table-preferences.spec.ts` und [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## 2026-09-17 — Veranstaltungsfilter um nächstes Kalenderjahr ergänzt

Die Veranstaltungsseite bietet im Zeitraumfilter nun `Nächstes Jahr`. Der Filter grenzt auf das vollständige folgende Kalenderjahr ein und berücksichtigt dabei Events, die dieses Jahr überschneiden. Ein Browser-Regressionstest prüft Auswahl, Sichtbarkeit und Ausschluss eines Events aus dem aktuellen Jahr. Quellen: Nutzerkonversation vom 2026-09-17, `src/lib/t2w/event-catalogue.ts`, `src/routes/veranstaltungen.tsx`, `tests/e2e/event-management.spec.ts` und [ClickUp-Import Veranstaltungen](concepts/clickup-veranstaltungen-import.md).

## 2026-09-17 — Sticky Seiten- und Tabellenkopf für Datentabellen

Beim vertikalen Scrollen bleiben der sticky Seitenkopf mit Suchleiste sowie die Tabellenköpfe sichtbar. `PageHeader` misst seine responsive Höhe und stellt sie als CSS-Offset bereit; `DataTable` und das allgemeine Tabellen-Primitive positionieren ihre Tabellenköpfe darunter. Auf schmaleren Viewports bleibt der horizontale Tabellen-Scroller aktiv; auf Desktopbreite wird sein Overflow freigegeben, damit der Sticky-Kopf am Seiten-Viewport haftet und Tabellenzeilen nicht überlagert. Eine Browser-Regression prüft Position, Sichtbarkeit und Scrollverhalten. Quellen: Nutzerkonversation vom 2026-09-17, `src/components/t2w/PageHeader.tsx`, `src/components/t2w/DataTable.tsx`, `src/components/ui/table.tsx`, `src/styles.css`, `tests/e2e/table-preferences.spec.ts` und [Gemeinsame kompakte Datentabellen](concepts/shared-compact-data-tables.md).

## 2026-09-17 — Lokale Design-Testinstanz mit Produktionsdaten befüllt

Die PostgreSQL-Datenbank der Docker-Compose-Testinstanz `design-ueberarbeiten-724ef7` wurde durch einen vollständigen, hashgeprüften Dump der Hostinger-Produktionsdatenbank `t2w-base-event-db-1` ersetzt. Beide Seiten verwenden Schema/Migrationen bis `0030_clickup_event_import`; der Restore lief ohne Fehler und der neu gestartete lokale Event-Service meldet `/ready` als bereit. Stichprobenartig exakt verglichen wurden unter anderem 764 Events, 126 Organisationen, 117 Kontakte, 756 ClickUp-Quellen, 12 PM-Aufgaben, 19 Hardwareausgaben und 107 Auditlog-Einträge. Der lokale Ausgangsstand bleibt im Docker-Backup-Volume als `/backups/pre-hostinger-copy-20260917.dump` erhalten; temporäre Transport-Dumps wurden gelöscht. Quelle: Nutzerkonversation und Betriebsprüfung vom 2026-09-17.

## 2026-09-18 — Aufgabenkategorien in den Auswahllisten verwalten

Unter Einstellungen → Auswahllisten → Projektmanagement / Aufgaben lassen sich Kategorien für Event- und globale Aufgaben anlegen, umbenennen, aktivieren/deaktivieren und per Ziehen oder Auf-/Ab-Schaltflächen sortieren. Die bestehende `PmGroup`-Persistenz bleibt die gemeinsame Quelle; Umordnen erfolgt atomar mit Versionsprüfung. Inaktive Kategorien bleiben an bestehenden Aufgaben erhalten und verhindern deren Bearbeitung nicht; neue Zuordnungen und Schnellanlagen in diesen Kategorien sind ausgeschlossen. Die Domain-Projektion übernimmt die konfigurierte Reihenfolge auch für Event-Kategorien und Zeitansichten.

Geprüft: zwei neue reale Browserabläufe mit PostgreSQL und Reload (inklusive 390-px-Ansicht, Konflikten und Duplikaten), drei bestehende Auswahllisten-Browserabläufe, drei PM-Integrationstests, 28 Domain-Tests und 42 gezielte Frontend-Tests bestanden. Frontend- und Event-Service-Build erfolgreich. Der strenge projektweite Frontend-Typecheck bleibt durch vorhandene Diagnosen außerhalb dieser Erweiterung blockiert; die neuen Komponenten und PM-Änderungen melden dort keine Diagnosen. Quellen: Nutzerkonversation vom 2026-09-18, [Designgrundlage](concepts/project-management-design.md), [Kategorienverwaltung](../src/components/t2w/PmCategorySettings.tsx), [PM-Service](../services/event-service/src/project-management.service.ts), [Browser-Regression](../tests/pm-e2e/category-settings.spec.ts).

## 2026-09-18 — Issue #49 Benutzerrechte und Veranstalterzugang umgesetzt

Migration `0031_user_access_and_task_attachments` führt die Rollen `ADMIN`, `USER` und `ORGANIZER`, Kontostatus, benutzerbezogenen Finanzzugriff, Veranstalterverknüpfung, Einladungs-/Reset-/E-Mail-Token, Sicherheitsbenachrichtigungen und private Aufgabenanhänge ein. Admins verwalten Benutzer unter Einstellungen; Sicherheitsänderungen widerrufen Sessions und werden auditiert. Finanznavigation, direkte Routen, Auszahlungs-/Automations-APIs, Bankdaten und Event-Finanzfelder sind ohne Freigabe gesperrt, während die operative Rechnungsempfängerzuordnung sichtbar bleibt. Veranstalter sehen nur persönlich zugewiesene Aufgaben des passenden Veranstalters, dürfen eigene Kommentare verwalten und Dateien hochladen, aber keine Aufgabenfelder mutieren.

Geprüft: Migration auf frischer PostgreSQL-16-Datenbank, 59 Event-Service-Unit-Tests, 111 Frontend-/Domain-Tests, vier reale PM-Integrationstests und zwei Browser-E2E-Abläufe mit PostgreSQL und Reload bestanden; Frontend- und Event-Service-Build sowie gezieltes Linting sind grün. Drei bestehende PM-Browsererwartungen zu Kategoriebezeichnungen und eingeklappten Gruppen bleiben unabhängig von Issue #49 rot. Quellen: Nutzerkonversation vom 2026-09-18, [Spezifikation](tasks/system-users-spec.md), [Migration](../services/event-service/prisma/migrations/0031_user_access_and_task_attachments/migration.sql), [Browser-Regression](../tests/pm-e2e/user-access.spec.ts).

## 2026-09-18 — Frontend-Typecheck wiederhergestellt

Der strenge projektweite Typecheck ist wieder fehlerfrei. Bereinigt wurden doppelte Übersetzungsschlüssel, unter `exactOptionalPropertyTypes` unzulässige `undefined`-Props, nicht abgesicherte Arrayzugriffe sowie veraltete CRM-, Event- und Auswahllisten-Testadapter. Damit ist die vorher im Eintrag zur Kategorienverwaltung dokumentierte Blockade aufgehoben. Geprüft mit `npx tsc --noEmit`, allen 111 Frontend-Unit-Tests, dem Produktions-Build und gezieltem ESLint für die geänderten Dateien. Quellen: Nutzerkonversation vom 2026-09-18, [Übersetzungen](../src/lib/i18n.tsx), [Event-API-Adapter](../src/lib/t2w/api.ts), [CRM-Adapter](../src/lib/crm/module.ts) und [Kontaktansicht](../src/routes/kontakte.tsx).

## 2026-09-19 — Deployment-Verifikation an Anmeldung angepasst

Die Deployments der Aufgabenkategorien und des nachfolgenden PM-Refactorings wurden vor dem Produktionsschritt gestoppt, weil zwei Hardware-Browsertests seit Einführung der verpflichtenden Anmeldung ohne Sitzung auf der Loginseite landeten. Die Hardware-Suite stellt nun für jeden Test eine vollständige Admin-Sitzung bereit. Der lokal identische CI-Aufruf besteht wieder mit drei aktiven Tests; ein bereits zuvor deaktivierter Test bleibt übersprungen. Quellen: Nutzerkonversation vom 2026-09-19, [Deployment-Workflow](../.github/workflows/deploy-hostinger.yml) und [Hardware-Browserregression](../tests/e2e/hardware.spec.ts).

## 2026-09-19 — Symbole und Farben für Aufgabenkategorien

Aufgabenkategorien erhalten optional ein konfigurierbares Symbol und eine Farbe. Die Auswahl liegt unter Einstellungen → Auswahllisten → Projektmanagement / Aufgaben, verwendet die gemeinsame Auswahllistenpalette und zeigt stets auch den Kategorienamen. Die gespeicherte Darstellung erscheint in Event-Kategorien, Event-Zeitachse, Aufgabenpanel, globaler Aufgabenliste und globalem Gantt. Migration `0032_pm_group_presentation` ergänzt die beiden Felder an `PmGroup`; der Browserablauf prüft Auswahl, Persistenz nach Reload, Event- und globale Anzeige sowie die schmale Ansicht. Geprüft mit Typecheck, Frontend- und Service-Build, 112 Frontend-Tests, 59 Service-Tests, vier PM-Integrationstests und zwei realen Browserabläufen gegen PostgreSQL. Quellen: Nutzerkonversation vom 2026-09-19, [Designgrundlage](concepts/project-management-design.md), [Kategorienverwaltung](../src/components/t2w/PmCategorySettings.tsx), [Migration](../services/event-service/prisma/migrations/0032_pm_group_presentation/migration.sql) und [Browser-Regression](../tests/pm-e2e/category-settings.spec.ts).

## 2026-09-19 — Kommunikationsanzeige als Zielbild aufgenommen

Die Anzeige der Kommunikationsseite wurde auf Nutzerwunsch im Stil der PM-Überarbeitung entworfen und als [Anzeigegrundlage Kommunikation](concepts/communication-display-design.md) aufgenommen. Kern: zwei Einstiege statt drei Timeline-Varianten, keine Bearbeitungszustände und keine Kennzahlenleiste — beantwortet wird in Outlook, die Seite dient dem Finden. Art und Richtung stehen als Symbolspalte (E-Mail, WhatsApp, Telefon, Gespräch, Videocall, Notiz; Richtungspfeil nur bei den ersten drei, Markengrün nur für den Ausgang aus dem TIME2WIN-Postfach). Die Spalte „Kontakt“ wird zu „Bezug“ und nimmt neben Personen auch Themen wie *Teilnehmer* aus den Auswahllisten auf.

Dazu die [Entscheidung zur Mailkategorisierung mit Ollama Cloud](decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md): Adressregeln zuerst, das Modell nur als serverseitiger Vorschlag mit Bestätigungspflicht, pro Event abschaltbar, weil dabei Mailinhalte den eigenen Server verlassen.

Beides ist ein Zielbild, keine ausgelieferte Funktion; der Code zeigt weiterhin die bisherige Timeline, und `kanal` kennt nur drei Werte. Es wurden keine Tests ausgeführt und kein Anwendungscode geändert. Die [Timeline-UI-Notiz](tasks/event-communication-timeline-ui.md) ist als Ist-Beschreibung gekennzeichnet. Quellen: Nutzerkonversation vom 2026-09-19, [Quellnachweis mit Design-Canvas](sources/2026-09-19-claude-kommunikation-design.md).

## 2026-09-19 — Architektur-Kandidaten nach PM-Vertiefung geprüft

Der auf Nutzerwunsch gestartete Architektur-Scan betrachtet die letzten 80 Commits und berücksichtigt die bereits abgeschlossene PM-Vertiefung. Drei Vorschläge: atomare Nachfolgeranlage (erste Empfehlung), konsistente Kategorieentwürfe/Versionskonflikte und gemeinsame Eventtabellen-Darstellung. Ein isolierter In-Memory-Fehlerversuch bestätigt, dass beim bisherigen Create/Dependency/Close-Ablauf eine angelegte Aufgabe bestehen bleibt und der Fehler beim Schließen verschwindet. Kein Browser-/Datenbanknachweis dieses Fehlerfalls und kein Anwendungstestlauf; der temporäre HTML-Bericht wurde in Chromium auf Desktop und 390 px geprüft. Auswahl und Interface-Entwurf stehen aus; dieser Review ändert keinen Anwendungscode. [Evidenz und Kandidaten](sources/2026-09-19-architecture-scan.md).

## 2026-09-19 — Kommunikationsanzeige nach der Anzeigegrundlage umgebaut

Der Kommunikationsreiter folgt jetzt der [Anzeigegrundlage](concepts/communication-display-design.md): zwei Einstiege „Verlauf“ und „Konversationen“ statt der drei Timeline-Varianten, keine Bearbeitungszustände und keine Kennzahlenleiste, vier Spalten mit schmaler Symbolspalte für Art und Richtung, Zeitgruppen Heute/Diese Woche/Früher · Monat, Suche über die volle Breite mit Trefferzahl und Hervorhebung, Chipleiste mit Artenzählern sowie ein Nachrichtenpanel als rechtes Sheet mit Konversationsliste und Outlook-Deeplink. Markengrün trägt nur noch der Ausgang aus dem TIME2WIN-Postfach und ersetzt das Logo-Abzeichen. Die Projektion in [`communication-timeline.ts`](../src/lib/t2w/communication-timeline.ts) liefert dafür Zeitgruppen, Konversationen, Artenzähler und Trefferstücke; die Artenzähler berücksichtigen alle übrigen Filter, aber nicht den Artenfilter selbst.

Nebenbefund und Korrektur: die gesamte Suite [`event-management.spec.ts`](../tests/e2e/event-management.spec.ts) lief seit der Anmeldepflicht ohne Sitzung auf die Loginseite und war vollständig rot. Der Hook aus [`hardware.spec.ts`](../tests/e2e/hardware.spec.ts) wurde übernommen; damit sind 45 der 61 Abläufe wieder grün. Die verbleibenden 16 betreffen Kunden, Kalender, Tabellenspalten und den Kontaktdialog und sind von dieser Änderung unberührt.

Geprüft: zwei Browserabläufe für Kommunikation (Synchronisation mit Reload sowie Suche, Artenfilter, Panel und Konversationen), 120 Frontend-Unit-Tests inklusive zehn neuer Tests für Zeitgruppen, Trefferhervorhebung, Artenzähler und Konversationsbündelung, `tsc --noEmit`, ESLint für die geänderten Dateien und der Produktions-Build. Offen bleiben die datenmodellabhängigen Schritte: Nachrichtenarten als Auswahlliste, Themenbezug samt Vorschlagsfeld und der Zeitraumfilter. Quellen: Nutzerkonversation vom 2026-09-19, [Quellnachweis](sources/2026-09-19-claude-kommunikation-design.md).

## 2026-09-19 — Nachrichtenarten als Auswahlliste

Die Arten der Kommunikationseinträge sind konfigurierbar: Migration `0033_communication_channel_options` legt `CommunicationChannelOption` an und belegt sie mit den bisher fest verdrahteten Werten `E-Mail`, `Telefon` und `Notiz`; `WhatsApp`, `Gespräch` und `Videocall` liegen inaktiv bereit. Gepflegt wird die Liste unter Einstellungen → Auswahllisten → Kommunikation / Nachrichtenarten mit Name, Symbol, Farbe, Reihenfolge und Aktivierung — dieselbe Mechanik wie Services und Eventrollen, kein zweiter Sonderweg wie bei `PmGroup`.

`kanal` ist damit ein freier Wert statt einer Union aus drei Literalen. Die Symbolspalte und die Filterleiste der Kommunikationsanzeige lesen die Liste; eine unbekannte Art fällt auf die Sprechblase zurück. Die Filterleiste zeigt jede aktive Art und zusätzlich jede Art, an der noch Einträge hängen, damit eine Deaktivierung keine Einträge unsichtbar macht. Die Konversationsbildung hängt nicht mehr an `kanal === "E-Mail"`, sondern am `conversationId`; damit bündeln auch Verläufe anderer Arten. Die gemeinsame Symbolpalette wurde um Telefon, Sprechblase, Personen und Notizblatt erweitert.

Geprüft: neuer Browserablauf (Art anlegen, Art deaktivieren, Wirkung in der Filterleiste des Events), die beiden bestehenden Kommunikationsabläufe, 122 Frontend-Unit-Tests inklusive zweier neuer für Artenzähler und artunabhängige Konversationen, `tsc --noEmit`, ESLint für die geänderten Dateien, Frontend- und Event-Service-Build mit Prisma-Generate. Die Migration wurde zusätzlich gegen eine Wegwerf-Datenbank im Container `t2w-pm-tests` gefahren: alle 33 Migrationen laufen von null durch, `prisma migrate diff` meldet für `CommunicationChannelOption` keine Abweichung zwischen SQL und `schema.prisma`, die sechs Arten sind korrekt vorbelegt und der Unique-Index greift. Die dabei gemeldeten Abweichungen an `PmTask`, `UserTablePreference`, `EventCommunicationMessage` und `EventFile` (`id`-Default, ein Fremdschlüssel) bestehen unabhängig von dieser Änderung. Zwei rote Eventrollen-Browserabläufe wurden gegen den Stand ohne diese Änderung gegengeprüft und sind Bestandsschaden. Offen bleibt Schritt 2: Themenbezug mit Vorschlagsfeld und Adressregeln. Quellen: Nutzerkonversation vom 2026-09-19, [Anzeigegrundlage](concepts/communication-display-design.md).

## 2026-09-19 — Themenbezug für Kommunikationseinträge

Ein Kommunikationseintrag trägt neben der erkannten Person ein Thema: für Sammelmails, hinter denen keine einzelne Person steht. Migration `0034_communication_topics` legt `CommunicationTopicOption` an (Teilnehmer, Sponsoren, Behörde, Rechnung, Presse) und ergänzt `topicId` an `EventActivity` und `EventCommunicationMessage`. Der Fremdschlüssel verwendet `ON DELETE SET NULL` — ein gelöschtes Thema nimmt keinen Eintrag mit. Gepflegt werden die Themen unter Einstellungen → Auswahllisten → Kommunikation / Themen; ein Eintrag trägt genau ein Thema (Nutzerentscheidung vom 19.09.2026).

Zugeordnet wird im Nachrichtenpanel. Das neue Kommando `assign-communication-topic` läuft über dieselbe Versionsprüfung wie die übrigen Eventmutationen; der Prisma-Adapter trifft mit zwei `updateMany` die richtige der beiden Tabellen und filtert dabei auf die Event-Id, damit kein fremder Eintrag über ein anderes Event geändert werden kann. In der Anzeige steht das Thema als eigenes Chip neben der Person, mit Symbol und Farbe aus der gemeinsamen Palette. „Ohne Bezug“ bedeutet jetzt weder Person noch Thema; daneben steht ein Themenfilter.

Geprüft: neuer Browserablauf (Thema im Panel zuordnen, Chip in der Zeile, Themenfilter, Reload), die drei übrigen Kommunikationsabläufe, 123 Frontend-Unit-Tests inklusive eines neuen für Themenfilter und die geänderte Bedeutung von „ohne Bezug“, `tsc --noEmit`, ESLint, Frontend- und Event-Service-Build. Migration 0034 wurde wie 0033 gegen eine Wegwerf-Datenbank gefahren; `prisma migrate diff` deckte dabei auf, dass die beiden Indizes auf `topicId` im Schema fehlten — nachgetragen, danach deckungsgleich. Offen bleiben die Adress- und Domainregeln sowie das Vorschlagsfeld. Quellen: Nutzerkonversation vom 2026-09-19, [Anzeigegrundlage](concepts/communication-display-design.md).

## 2026-09-19 — Adress- und Domainregeln zurückgestellt

Themen werden von Hand im Nachrichtenpanel gesetzt; die Regeln „Adresse oder Domain → Thema“ werden auf Nutzerwunsch vorerst nicht gebaut. Das ist eine Entscheidung, kein offener Punkt: die manuelle Zuordnung ist der vorgesehene Weg, solange nichts anderes beschlossen wird.

Folge für die [Mailkategorisierung mit Ollama Cloud](decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md): deren Stufe 1 war als deterministischer Unterbau vor der Modellanbindung gedacht. Dieser Unterbau fehlt nun. Wer die Modellstufe angeht, muss Stufe 1 nachholen oder begründen, warum das Modell ohne sie tragfähig ist. Die Auflagen zu Vorschlag statt Zuordnung, serverseitigem Aufruf und Abschaltbarkeit je Event bleiben gültig. Quelle: Nutzerkonversation vom 2026-09-19.

## 2026-09-19 — Auswahllisten laden unabhängig voneinander

Das Deployment nach dem Merge von PR #56 blieb im `verify`-Job hängen: der Hardware-Browserablauf fand die Objektauswahl leer vor. Ursache war die Erweiterung der Auswahllisten um `communicationChannels` und `communicationTopics`. `createSelectionListWorkspace().load()` holte alle Listen mit `Promise.all`; der Hardware-Test mockt seine Endpunkte einzeln und kannte die beiden neuen nicht, also scheiterte ein Aufruf und riss sämtliche Listen mit — auch die Hardware-Objekte.

`load()` verwendet jetzt `Promise.allSettled`: jede Liste steht für sich, eine ausgefallene behält ihren letzten Stand statt die übrigen auszublenden. Das betrifft nicht nur Tests — fiel in Produktion ein Listen-Endpunkt aus, waren bisher alle Auswahllisten leer. Ein Unit-Test sichert das Verhalten ab; der Hardware-Ablauf mockt zusätzlich die beiden neuen Endpunkte, damit er abbildet, was die Anwendung tatsächlich abruft.

Geprüft: Hardware-Suite (3 bestanden, 1 wie zuvor übersprungen), vier Kommunikationsabläufe, 124 Frontend-Unit-Tests, `tsc --noEmit`, ESLint, Frontend-Build. Quelle: fehlgeschlagener Workflow-Lauf 35458821437 vom 2026-09-19.

## 2026-09-19 — PR- und Deploymentstand bestätigt

Auf Nutzeranfrage den vermeintlich offenen Pull Request geprüft: [PR #56 – Kommunikationsanzeige neu aufgebaut, Nachrichtenarten konfigurierbar](https://github.com/AndiT2W/t2w-base/pull/56) ist bereits zusammengeführt; zum Prüfzeitpunkt gibt es keinen offenen PR. Lokales `main` und GitHub-`main` stehen beide auf `b0876eac9a39d1b57164e31d4cae376ef2904bdc`, einschließlich der anschließenden Auswahllistenkorrektur. Der [Hostinger-Workflow 35459092075](https://github.com/AndiT2W/t2w-base/actions/runs/35459092075) bestätigt erfolgreiche `verify`- und `deploy`-Jobs für diesen Commit (Deployment beendet am 19.09.2026 um 19:51 Uhr Europe/Vienna). Keine weitere Implementierung oder erneute Auslieferung erforderlich; in dieser Prüfung keine lokalen Anwendungstests ausgeführt.

## 2026-09-19 — Eventlisten und Tabellenwerkzeuge vereinheitlicht

Nutzerwunsch: die Anzeige des gesamten t2w_base überarbeiten, nachdem Kommunikation und Projektmanagement bereits umgestellt sind; im Verlauf präzisiert auf „die Spaltenauswahl soll intuitiv sein und muss kein eigener Button sein, der Excel-Export kann nur ein Symbol sein, Spalten sollen sortierbar sein, Aktion wird nicht benötigt" und „das Tabellenlayout soll für alle anderen Tabellen gelten, z. B. Kontakte und Kunden". Grundlage sind [PM-Designgrundlage](concepts/project-management-design.md), [Kommunikationsanzeige](concepts/communication-display-design.md) und [Tabellenstandard](concepts/shared-compact-data-tables.md); neu dokumentiert als [Eventlisten und Tabellenwerkzeuge](concepts/event-list-display-design.md).

**Für alle Tabellen:** Spaltenauswahl und Excel-Export sind zwei Symbole statt beschrifteter Schaltflächen, die je Seite woanders standen. `TableToolbar` ist ihre gemeinsame Definition. Sie stehen **am rechten Ende der Filterzeile, auf Höhe der Filter** — auf Nutzerwunsch, um die eigene Werkzeugzeile und damit rund 36 px Höhe zu sparen. Eine Tabelle ohne Filterzeile bekommt die Leiste unverändert von `DataTable` (`tools="ueber-tabelle"`, Standard); Seiten mit Filterzeile setzen `tools="extern"`. Die Regel lautet damit: rechtes Ende der Zeile direkt über der Tabelle. Umgesetzt in Übersicht, Veranstaltungen und Hardware auf Filterhöhe sowie in Kontakten und Kunden auf Höhe der Tab-Leiste; dafür wanderte deren Spaltenzustand von den Tabellenkomponenten zur Seite (`usePeopleTable`, `useCustomerTable`), die `table` und `tableRef` hineinreicht. Tabellen ohne Spaltenpräferenz zeigen nur das Exportsymbol.

**Spalten sind jetzt wirklich ordenbar.** `table-model.ts` konnte `moveColumn` immer, aber nur Hardware reichte es durch — und Übersicht, Veranstaltungen und Kontakte gaben ihre Zellen fest verdrahtet aus statt in der Reihenfolge von `visible`. Die Reihenfolge ließ sich also weder einstellen noch hätte sie gewirkt. Alle Listen geben Kopf und Zellen jetzt über `visibleColumns.map(…)` aus; im Spaltenmenü gibt es „nach links" und „nach rechts", oben ist links, und die Reihenfolge überlebt das Neuladen.

**Die Aktionsspalte entfällt** in beiden Eventtabellen: der Eventname führt bereits ins Detail. Outlook- und SharePoint-Links bleiben in der Ordnerspalte, die Zeile selbst wird kein Link.

**Eine Eventtabelle statt zweier Kopien.** [`EventTableColumns.tsx`](../src/components/t2w/EventTableColumns.tsx) hält Spaltenbestand, Sortierwerte, Kopf- und Zellinhalte einmal; die Kopien waren bereits auseinandergelaufen (Terminkollision nur in einer, Aufgabenzahl einmal als Zahl und einmal als Chip). Damit ist Kandidat 3 des [Architektur-Scans](sources/2026-09-19-architecture-scan.md) für die Darstellung eingelöst; Filter, Datenauswahl und Präferenzhaltung bleiben bei den Seiten.

**Außerdem in der Eventliste:** Status, Zeitraum und Archiv sind Auswahlchips mit Markenakzent, „n Filter zurücksetzen" bezieht sich auf die Grundstellung der Seite, die Ansichten stehen als Segmentleiste statt als Unterstrich-Reiter, die mobilen Karten tragen Sportart- und Service-Badges, und die Tagesanzahl verwendet `tageZwischen`. `FilterChip`, `DateChip` und `FilterResetChip` liegen gemeinsam in [`FilterChip.tsx`](../src/components/t2w/FilterChip.tsx); die Aufgabenübersicht verwendet sie statt eigener Kopien (reine Extraktion, Markup unverändert).

**Am Primitive:** `.t2w-table-header` und `.t2w-data-table > thead` teilen sich dieselbe Regel in [`styles.css`](../src/styles.css); vorher setzte `DataTable` seinen Kopf über eigene Utilities und wich vom dokumentierten Standard ab. Die Routen setzen keine zweite Trennlinie und keinen zweiten Hover mehr über die des Primitives.

**Filter zurücksetzen ist ebenfalls ein Symbol** — mit der Anzahl daneben (`✕ 2`), der Satz im barrierefreien Namen und im Tooltip. Die Zahl bleibt sichtbar, weil sie die einzige Stelle ist, an der steht, wie viele Filter gesetzt sind; PM- und Kommunikationsgrundlage schreiben sie fest. Im leeren Zustand bleibt der ausgeschriebene Satz als Schaltfläche, dort ist er der Ausweg. `FilterResetChip` verwenden jetzt Aufgaben, Veranstaltungen, Kommunikation und Hardware — vorher gab es drei Varianten (Text ohne Symbol, `X` plus Text, `RotateCcw` plus Text ohne Zahl). Hardware zählt dafür seine gesetzten Filter, statt nur zu wissen, *dass* welche gesetzt sind.

**Jeder Eventstatus hat jetzt eine eigene Farbe** (Nutzerentscheidung vom 19.09.2026 auf die Frage, ob die Statusfarben erklärt werden sollen). Vorher trugen Anfrage, Angebot gesendet, Akquise und Datum prüfen dasselbe Amber: der Punkt konnte den Status nicht benennen, und die vorhandene Legende der Übersicht zeigte vier gleich aussehende Einträge. Neu sind `--status-akquise` (Violett), `--status-angebot` (Blau) und `--status-datum-pruefen` (neutral, weil dort noch nichts entschieden ist); Anfrage, Zugesagt und Abgesagt behalten ihren Wert. Statusbadge und Kalenderansicht verwenden dieselbe Zuordnung. Die Legende ist als `StatusLegend` gemeinsam und steht jetzt unter **beiden** Eventtabellen statt nur unter der Übersicht — ab Desktopbreite, weil die mobilen Karten ohnehin Punkt und Text nebeneinander zeigen. Die Regel „Farbe trägt die Bedeutung nie allein" bleibt: Tooltip, Screenreader-Text und Legende nennen den Status ausgeschrieben. Eine Browser-Regression prüft auf beiden Seiten, dass die Legende sichtbar ist, dass die sechs Punkte sechs verschiedene Farben haben und dass sie schmal entfällt.

Netto rund 340 Zeilen weniger Anwendungscode.

Tests: `tsc --noEmit`, ESLint und 124 Frontend-Unit-Tests bestanden. Neue Browserabläufe decken die Chipleiste samt Zurücksetzen, die Badges der mobilen Karte und das Umordnen der Spalten mit Reload ab. Bestehende Erwartungen mussten mit den Entscheidungen mitgehen: Spaltenzahl ohne Aktionsspalte, Spaltenauswahl und Export nicht mehr in der Filterzeile, der Zeitraumwechsel über `selectOption` statt über einen Radix-Trigger. `tests/e2e/table-preferences.spec.ts` lief seit der verpflichtenden Anmeldung komplett rot — der Datei fehlte der `auth/me`-Hook, den `event-management.spec.ts` schon hat; mit ihm bestehen alle Abläufe, und der Kopftest prüft jetzt die dokumentierten 10 px/Versalien/Haarlinie statt der abgelösten Variante „Ausgewogen".

Nicht angefasst: die 16 roten Abläufe in `tests/e2e/event-management.spec.ts` stammen nicht aus dieser Arbeit und wurden vor der Änderung als Ausgangsstand festgehalten. Die PM-Browsertests brauchen weiterhin `PM_TEST_DATABASE_URL` und liefen hier nicht.

## 2026-09-20 — Übersichtsfilter als Chips, Spalten ziehbar, alle Tabellen sortierbar

Nutzerwunsch: die beiden offenen Punkte der Tabellenüberarbeitung umsetzen und Spalten zusätzlich sortierbar machen. Fortschreibung von [Eventlisten und Tabellenwerkzeuge](concepts/event-list-display-design.md).

**Schnellfilter der Übersicht sind Chips.** Die fünf Schnellfilter sind `ToggleChip` mit `aria-pressed`; ein zweiter Klick führt zurück auf „Alle aktiven". Der Statusfilter ist ein `FilterChip` mit abweichendem barrierefreiem Namen („Status filtern"), und „n Filter zurücksetzen" zählt beide. Damit trägt die Übersicht dieselbe Filtersprache wie Veranstaltungen, Aufgaben und Kommunikation; ihre Kennzahlenzeile und der Überfällig-Hinweis bleiben.

**Spalten lassen sich ziehen.** Sichtbare Spalten im Spaltenmenü sind `draggable` und bekommen einen Anfasser; die Pfeilschaltflächen bleiben daneben. Ziehen ist der Mausweg, die Schaltflächen sind der Weg für Tastatur und Bildschirmleser — beide lösen dieselbe Aktion `moveColumn` aus, damit die Präferenz die einzige Quelle der Reihenfolge bleibt. Das Ablegen verschiebt schrittweise, weil das Modell nur „ein Schritt nach links/rechts" kennt.

**Alle Tabellen sortieren nach Inhalt.** Bisher galt das nur für fünf; Angebote, Rechnungen, Auszahlungen, Auditlog, Event-Auszahlungen, Event-Hardware und die beiden Event-Detailtabellen hatten keine sortierbaren Köpfe. Neu ist `useTableSort` — Sortierung ohne Präferenzspeicher und ohne Spaltenauswahl, damit auch eine feste Tabelle sortierbare Köpfe bekommt, ohne eine Präferenzkennung erfinden zu müssen. Auswahl- und Aktionsspalten bleiben ungeordnet. Die Sortierung dieser Tabellen ist bewusst lokaler Zustand und überlebt das Neuladen nicht.

Tests: `tsc --noEmit`, ESLint und 124 Unit-Tests bestanden. Drei neue Browserabläufe decken die Schnellfilter-Chips samt Zurücksetzen, das Umordnen per Ziehen mit gespeicherter Reihenfolge und die Sortierung einer Tabelle ohne Spaltenpräferenz ab. Der Ziehtest schickt die HTML5-Drag-Ereignisse gezielt, weil ein Mauszug sie nicht auslöst.

## 2026-09-22 — Mail-Klassifizierungs-Testservice als Dry-Run

Der Event-Service besitzt jetzt `POST /api/v1/mail-classifier/test`. Der Dienst klassifiziert eine Mail über Ollama Cloud, validiert Kategorie und Eventcode gegen eine erlaubte Liste und liefert einen nachvollziehbaren Outlook-Markierungs- sowie optionalen Weiterleitungsplan. Es gibt noch keine Outlook-Mutation und keinen Versand; jede Weiterleitung bleibt explizit freigabepflichtig. Die Regressionen decken sichere Eventübernahme, unbekannte Eventcodes und fehlerhafte Cloudantworten ab.
