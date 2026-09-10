---
title: Integriertes Projektmanagement für t2w-base
type: specification
status: proposed
updated: 2026-09-10
sources:
  - ../sources/2026-09-10-user-project-management.md
---

# Spezifikation: Integriertes Projektmanagement

**Historische Fassung; maßgeblich ist [Spezifikation v3](project-management-spec-v3.md).** Nicht zur Umsetzung widersprechender Status-, Migrations- oder MVP-Regeln verwenden.

Version 1.0 · Stand 10.09.2026 · Fachliches und technisches Zielbild zur Umsetzung.

Die Anforderungen des [Nutzerauftrags](../sources/2026-09-10-user-project-management.md) bilden den verbindlichen Bedarf. Die folgenden Detailregeln sind Umsetzungsvorschläge; offene Produktentscheidungen sind in Abschnitt 14 ausgewiesen. „Muss“ bezeichnet eine Bedingung für die Abnahme dieses Zielbilds, keine Behauptung über bereits implementiertes Verhalten.

## 1. Ausgangslage und Abgrenzung

### 1.1 Verifizierter Stand im Repository

| Bestehender Baustein | Befund und Konsequenz |
| --- | --- |
| [Prisma-Schema](../../services/event-service/prisma/schema.prisma) | `EventTask` besitzt ID, Eventreferenz, Titel, optionales `dueAt`, Freitext `responsible`, `completed` und Zeitstempel. Dieses Modell wird erweitert. |
| [Eventdetailseite](../../src/routes/events.$eventcode.tsx) | Aufgaben lassen sich anlegen und abhaken. Der bestehende Reiter wird zum Projektmanagement-Bereich. |
| [Globale Aufgabenroute](../../src/routes/aufgaben.tsx) und [Projektionen](../../src/lib/t2w/event-projections.ts) | `/aufgaben` zeigt aus geladenen, nicht archivierten Events abgeleitete Aufgaben. Suche und Offen-Filter existieren; die Statusspalte verwendet bei offenen Aufgaben noch den Eventstatus. Das Ziel braucht eigenständige Aufgabenstatus und serverseitige Abfragen. |
| [Serienmutationen](../../services/event-service/src/event-mutations.ts) | Events werden über eine gemeinsame optionale UUID `seriesId` verbunden. Eine Tabelle `EventSeries` und eine referenzielle Beziehung fehlen im Schema. |
| [Event-Kopie](../../services/event-service/src/prisma-event-mutation.adapter.ts) | Übernimmt Stammdaten, Kontaktrollen, Empfänger und Services, jedoch keine Aufgaben. Diese Trennung wird erhalten und um eine explizite Vorlagenübernahme ergänzt. |
| [Controller](../../services/event-service/src/events.controller.ts) | Aufgaben-POST/PATCH unter `/api/v1/events/:id/tasks`; Mutationen verwenden derzeit die Eventversion und liefern den Eventdatensatz zurück. |
| [AuditService](../../services/event-service/src/audit.service.ts) | Gemeinsamer Audit-Schreibzugang mit optionalem Transaktionswriter vorhanden. Aufgabe und Audit müssen künftig zusammen gespeichert werden. |
| [AuthGuard](../../services/event-service/src/auth.guard.ts) und Schema | Sessionbasierte Identität; Benutzer mit `ADMIN` oder `MITARBEITER`. Wiederverwenden, fachliche Rechte zusätzlich serverseitig prüfen. |
| Schema: `Contact`, `EventContact`, `EventActivity`, `EventCommunicationMessage`, `EventFile`, `HardwareIssue`, `Payout` | Bestehende Beziehungen nutzen; keine zweite Kontakt-, Mail-, Hardware- oder Finanzverwaltung aufbauen. |

Die Aussagen beschreiben den geprüften Checkout, keine Prüfung des Produktionssystems.

### 1.2 Fachliches Ziel und Nutzerproblem

Interne Mitarbeitende sollen pro Event wissen, welche Arbeit offen ist, wer sie übernimmt, was als Nächstes passiert und was den Event gefährdet. Die operative Leitung muss eventübergreifend Engpässe erkennen und Aufgaben umverteilen können. Wiederkehrende Jahresveranstaltungen sollen mit einem vorbereiteten Plan starten, ohne Vorjahresergebnisse umzuschreiben.

Heute reichen eine Checkbox und ein Freitext-Verantwortlicher dafür nicht aus: Wartefälle, Abhängigkeiten, Risiken und Lieferstände sind nicht strukturiert erkennbar. Ein Wechsel zu externer Aufgabenpflege zerreißt den Zusammenhang zwischen Event, Kontakt und Kommunikation.

Ein jährliches Event ist der operative Projektcontainer. Es entsteht keine zusätzliche, parallel zu `Event` gepflegte Entität `Project`. Die Eventserie hält wiederverwendbare Planungsvorgaben. Die globale Übersicht zeigt dieselben Aufgaben wie das Event, keine Kopien.

### 1.3 Umfang und Verhältnis zu älteren Spezifikationen

Zum Zielumfang gehören Liste, Kanban, Kalender, Dashboard, Verantwortliche, Fristen, Wartefälle, Blockierungen, Risiken, Abhängigkeiten, Kommentare, Historie, Serienvorlagen und Lieferstände. Umsetzung in Inkrementen ist möglich; die vollständige Abnahme umfasst alle hier beschriebenen Muss-Anforderungen.

Nicht enthalten: ClickUp-Anbindung oder laufende Synchronisation, eigenständige CRM-Daten, Gantt-/Ressourcenoptimierung, Zeiterfassung, Kundenportal, automatische E-Mail-Sendungen, Carrier-Tracking oder eine neue Lager-/Finanzbuchhaltung. Historische ClickUp-Daten sind nur Referenzmaterial; ein Import wäre ein eigener Auftrag.

Die ältere [Eventverwaltungsspezifikation](event-management-spec.md) schloss komplexe Projektplanung zunächst aus. Der aktuelle Nutzerauftrag erweitert diesen Umfang. Deren Regel „Risiko ist kein Eventfeld“ bleibt erhalten: Event-Risikoanzeigen werden aus Aufgaben abgeleitet. Der offene Punkt „Event oder Project“ in der Übersicht wird für dieses Zielbild mit „Event als Projektcontainer“ beantwortet.

## 2. Fachliche Anforderungen und Regeln

### 2.1 Aufgabe und Zuständigkeit

- Jede Aufgabe gehört genau zu einem jährlichen Event. Die Eventserie wird über dieses Event ermittelt.
- Titel ist Pflicht, 1–200 Zeichen nach Trimmen. Beschreibung erläutert Ergebnis und Abnahmekriterium; maximal 20.000 Zeichen.
- Genau ein internes Benutzerkonto ist hauptverantwortlich. Neue Aufgaben dürfen vorläufig unzugeordnet sein und erscheinen dann ausdrücklich unter „Nicht zugewiesen“.
- Vor dem Beginn der Bearbeitung müssen Verantwortlicher, Bereich und ein konkreter nächster Schritt vorhanden sein. Der nächste Schritt ist ein separates Textfeld mit maximal 2.000 Zeichen.
- Externe Kontakte können Ansprechpartner oder erwartete Rückmelder sein; sie ersetzen nicht die interne Verantwortung und erhalten dadurch keine Zugriffsrechte.
- Standardbereiche: Personal, Druckmittel, Hardware, Anmeldung, Versand, Finanzen, Kommunikation und „Nicht zugeordnet“. Admins können Bereiche ergänzen, umbenennen, sortieren und deaktivieren. Historische Zuordnungen bleiben erhalten.
- Prioritäten: niedrig, normal (Standard), hoch, kritisch. Kritisch bedeutet: Nichterfüllung gefährdet die Durchführung oder einen verbindlichen Event-Meilenstein. Eine Begründung ist Pflicht.
- Verschieben zwischen Status und Bereichen ist erlaubt. Ein Wechsel zu einem anderen Event ist im Erstumfang nicht erlaubt; versehentliche Zuordnung wird durch begründetes Stornieren und eine neue Aufgabe mit Herkunftsverweis korrigiert.

### 2.2 Fristen, Überfälligkeit und Handlungsbedarf

Fälligkeit ist entweder ein Kalendertag oder ein genauer Zeitpunkt. Pro Event wird eine IANA-Zeitzone ergänzt, initial `Europe/Vienna`. Tagesfristen gelten bis zum Beginn des Folgetages in dieser Zone, unabhängig von der Browser-Zeitzone. Zeitpunkte werden in UTC gespeichert und mit Zone angezeigt. Ohne Frist ist eine Aufgabe niemals überfällig, aber im Filter „Ohne Fälligkeit“ auffindbar.

Definitionen für alle Ansichten und APIs:

| Kennzahl | Exakte Regel |
| --- | --- |
| Offen | Status weder `DONE` noch `CANCELLED`, unabhängig von Priorität oder Blockierung. |
| Überfällig | Offen und Frist vorhanden und Referenzzeitpunkt größer/gleich Fristgrenze; Tagesfrist erreicht ihre Grenze am Folgetag. |
| Heute fällig | Frist fällt auf den lokalen heutigen Eventtag; bei Uhrzeit kann sie gleichzeitig überfällig sein. |
| Blockiert | Mindestens eine ungelöste manuelle Blockierung oder eine nicht erfüllte Finish-to-Start-Abhängigkeit. |
| Red Flag | Mindestens ein aktives, explizit erfasstes Risiko. Nicht identisch mit Überfälligkeit. |
| Kritische Aufgabe | Priorität kritisch oder aktives Risiko mit Schwere kritisch. |
| Nächste kritische Fälligkeiten | Offene kritische Aufgaben mit Frist in den nächsten sieben lokalen Kalendertagen inklusive heute; bereits überfällige separat anzeigen. |
| Handlungsbedarf | Vereinigungsmenge aus überfällig, blockiert und aktive Red Flag; eine Aufgabe wird nur einmal gezählt. |

Ein kritischer offener Vorgänger, dessen Frist nach der Frist seines Nachfolgers liegt, erzeugt zusätzlich einen sichtbaren Planungskonflikt. Es gibt im Erstumfang keine automatische Berechnung eines kritischen Pfads ohne Dauer- und Ressourcenmodell.

Bei Überfälligkeit zeigt die UI Frist, Dauer der Überschreitung, nächsten Schritt und `delayReason`. Fehlende Gründe werden ehrlich als „Grund noch nicht dokumentiert“ angezeigt. Der Fristablauf wird niemals durch fehlende Begründungen unterdrückt. Bei der nächsten Bearbeitung einer überfälligen Aufgabe sind Grund und nächster Schritt verpflichtend; Kommentieren bleibt möglich. Verschieben einer Frist verlangt einen Grund, damit wiederholtes Verschieben erkennbar bleibt.

### 2.3 Rückmeldung, Blockierung und Risiko

„Wartet auf Rückmeldung“ verlangt: erwarteter Inhalt, Ansprechpartner (bestehender Kontakt oder erklärender Freitext), Datum der Anfrage, Wiedervorlagetermin und interner Verantwortlicher. Eine vorhandene Mail oder Aktivität kann verknüpft werden. Eine eingehende Mail erledigt die Aufgabe nicht automatisch; ein Benutzer ordnet die Antwort zu und entscheidet über den nächsten Status.

Eine manuelle Blockierung verlangt Grund, konkreten Entsperrschritt und ein intern zuständiges Konto; mehrere Blockierungen sind möglich. Beim Auflösen werden Lösung, Benutzer und Zeitpunkt gespeichert. Eine Abhängigkeitsblockierung nennt die konkreten Vorgänger und deren Zustand.

Eine Red Flag verlangt Risikobeschreibung, Auswirkung, Schwere (hoch/kritisch), Gegenmaßnahme und Risikoverantwortlichen. Mehrere Risiken pro Aufgabe sind möglich. Auflösen verlangt einen Grund; das Risiko bleibt in der Historie. Keine automatische Red Flag allein durch eine verspätete Aufgabe. Kritische Priorität und Red Flag werden getrennt gefiltert und angezeigt.

### 2.4 Abhängigkeiten

Eine Kante `Vorgänger → Nachfolger` bedeutet: Der Nachfolger darf erst in Arbeit gehen oder abgeschlossen werden, wenn der Vorgänger erledigt ist. Unterstützt werden ausschließlich Abhängigkeiten innerhalb desselben Events. Selbstbezüge, doppelte Kanten und Zyklen sind verboten; auch konkurrierende Änderungen dürfen keinen Zyklus erzeugen.

Ein stornierter Vorgänger erfüllt die Abhängigkeit nicht. Ein Benutzer muss die Kante mit Begründung entfernen oder den Vorgänger wieder öffnen und erledigen. Ein blockierter Nachfolger darf kommentiert und geplant werden. Das Hinzufügen eines unerledigten Vorgängers zu einem bereits erledigten Nachfolger ist verboten. Wiederöffnen eines Vorgängers mit bereits erledigten Nachfolgern wird mit Konflikt abgelehnt, bis diese bewusst wieder geöffnet oder die Beziehungen begründet entfernt wurden.

## 3. Aufgabenlebenszyklus und Historie

Der gespeicherte Arbeitsstatus und der sichtbare Zustand sind getrennt: `workflowStatus` speichert `NEW`, `IN_PROGRESS`, `WAITING`, `DONE` oder `CANCELLED`; `effectiveStatus` ist bei offenen Aufgaben mit Blockern `BLOCKED`, sonst der Arbeitsstatus. Damit gehen Rückmeldeinformationen bei einer Blockierung nicht verloren. Die UI erklärt beispielsweise „Blockiert; zuvor wartet auf Rückmeldung“.

| Aktion / Übergang | Bedingungen und Wirkung |
| --- | --- |
| Anlegen → Neu | Titel und Event vorhanden; Status neu, Priorität normal. |
| Neu → In Arbeit | Zuständigkeit, Bereich und nächster Schritt vorhanden; keine unerfüllten Abhängigkeiten. |
| Neu/In Arbeit → Wartet auf Rückmeldung | Pflichtdaten aus 2.3 vollständig; vorherige Warteepisode bleibt historisch erhalten. |
| Offener Status → Blockiert | Manuelle Blockierung erfassen oder unerfüllte Abhängigkeit hinzufügen; gespeicherter Arbeitsstatus bleibt erhalten. |
| Blockiert → vorheriger Arbeitsstatus | Alle Blockierungen gelöst; keine automatische Aufnahme in Arbeit. |
| Wartet → In Arbeit | Rückmeldeepisode mit Antwort/Ergebnis schließen; nächster Schritt aktualisieren. |
| Offen → Erledigt | Verantwortlicher gesetzt, keine Blocker, keine aktive Red Flag, offene Warteepisode beantwortet oder begründet geschlossen; Lieferbedingungen erfüllt. Ergebnisnotiz und Abschlussbenutzer/-zeit speichern. |
| Offen → Storniert | Begründung zwingend; Risiken und manuelle Blockierungen begründet schließen; offene Warteepisode schließen. Storniert zählt nicht als erfolgreich erledigt. |
| Erledigt/Storniert → Neu oder In Arbeit | Begründetes Wiederöffnen, neue Versionsnummer, frühere Abschlussdaten in Historie erhalten; Abhängigkeitsregeln beachten. |
| Erledigt/Storniert → Archiviert | Archiv ist eine Sichtbarkeits-/Schreibschutzmarkierung, kein neuer Arbeitsstatus. Nur terminale Aufgaben einzeln archivieren. |

Erledigte Aufgaben erscheinen sofort im Bereich „Abgeschlossen“. Sie werden weder gelöscht noch beim Jahreswechsel zurückgesetzt. Ein archiviertes Event bleibt mit Aufgaben, Kommentaren und Historie lesbar. Aufgabenänderungen erfordern zunächst die Reaktivierung des Events durch einen Admin.

Eventarchivierung darf offene Aufgaben nicht still aus der globalen Arbeitssicht entfernen: Solange offene Aufgaben vorhanden sind, wird sie serverseitig abgelehnt. Eventabsage erledigt Aufgaben nicht automatisch, da Storno-, Rückgabe- und Finanzarbeiten verbleiben können.

## 4. Wiederkehrende Aufgaben über Eventserien

### 4.1 Serienvorlagen

Eine Eventserie besitzt versionierte Aufgabenvorlagen. Vorlagen enthalten Titel, Beschreibung, Bereich, Priorität, nächsten Schritt, optionale Zuständigkeitsvorgabe, Fristregel, Lieferaufgabentyp und Abhängigkeiten zwischen Vorlagen. Sie enthalten keine operativen Kommentare, erledigten Status, aktiven Risiken, alten Sendungsnummern oder Vorjahres-Mails.

Eine Vorlagenfrist ist `NONE`, `EVENT_START` oder `EVENT_END` plus ganzzahliger Kalendertag-Offset und optionale lokale Uhrzeit. Beispiel: „Druckfreigabe einholen“, Start minus 21 Tage; „Hardware zurückholen“, Ende plus 7 Tage. Wochenenden werden nicht automatisch verschoben. Jahr plus eins oder 365 Tage ist keine zulässige Fristberechnung.

### 4.2 Übernahmeablauf

1. Neues jährliches Event regulär erstellen oder über den bestehenden Kopierdialog anlegen und mit der Serie verbinden.
2. „Standardaufgaben aus Eventserie übernehmen“ auswählen; Vorschau zeigt Vorlagenversion, neue Termine, Abhängigkeiten und Zuständigkeiten.
3. Standardmäßig alle aktiven Vorlagen wählen. Bei abgewählten Vorgängern muss der Benutzer abhängige Vorlagen ebenfalls abwählen oder die wegfallende Beziehung explizit bestätigen.
4. Inaktive Verantwortliche werden nicht neu zugewiesen. Die Vorschau markiert die Aufgabe als „Nicht zugewiesen“ und verlangt Bestätigung. Ein Textfeld `Event.responsible` wird nicht automatisch einem Login zugeordnet.
5. Übernahme atomar speichern: neue Aufgaben-IDs, neue eventinterne Abhängigkeiten, Status neu, leere operative Historie außer Herkunfts-/Erstellungsnachweis. Unerfüllte übernommene Abhängigkeiten können den sichtbaren Zustand sofort auf blockiert setzen.
6. Der Vorgängerevent bleibt unverändert. Herkunft verweist auf stabile Vorlage, Revision und Übernahmelauf, optional auf eine bewusst als Vorlage verwendete Vorjahresaufgabe.

Pro Event und stabiler Vorlagen-ID darf höchstens eine instanziierte Aufgabe entstehen. Wiederholung desselben Übernahmebefehls liefert dasselbe Ergebnis; neu ergänzte Vorlagen können später separat übernommen werden. Eine neuere Revision erzeugt keine zweite Aufgabe derselben Vorlage und überschreibt keine bestehende Aufgabe. Auch eine stornierte Instanz verhindert unbeabsichtigte Doppelanlage.

Eine Aufgabe kann ausdrücklich „Als Serienvorlage speichern“. Die Vorschau zeigt nur wiederverwendbare Felder; Abschluss, Diskussion, Risiken und operative Kommunikationslinks werden nicht übernommen. Änderungen an Vorlagen wirken ausschließlich auf zukünftige Übernahmen.

### 4.3 Termin- und Serienänderungen

Verschiebt sich das Eventdatum, zeigt die UI eine Vergleichsvorschau für offene, relativ geplante Aufgaben. Erst bestätigte Änderungen werden angewandt; manuell gesetzte/überschriebene Termine und erledigte Aufgaben bleiben bestehen. Ursprungsregel und letzte berechnete Frist werden gespeichert. Ein zwischen Vorschau und Bestätigung geänderter Event oder Task erzeugt einen Konflikt statt Überschreiben.

Serienwechsel und Entfernen der Serienverknüpfung verschieben keine Aufgaben und ändern keine Fristen. Vorlagenherkunft bleibt erhalten; die aktuelle Serienfilterung folgt dem Event. Serienzusammenlegung und automatische Zusammenführung von Vorlagen sind nicht Teil des Erstumfangs.

## 5. UX/UI-Anforderungen: Informationsarchitektur

### 5.1 Navigation

- Bestehender Eventreiter „Aufgaben“ erhält die Beschriftung „Projektmanagement“. Er bleibt innerhalb von `/events/$eventcode`, neben den bestehenden Stammdaten-, Kontakt- und Kommunikationsbereichen.
- Bestehender globaler Menüpunkt und Route `/aufgaben` werden zum globalen Projektmanagement ausgebaut. Keine zweite parallele Aufgabenroute.
- Eventansicht: Übersicht, Liste, Kanban, Kalender, Abgeschlossen. Globale Ansicht: Dashboard, Liste, Kanban, Kalender. Standard global: Liste der offenen Aufgaben; Standard im Event: Übersicht mit offener Aufgabenliste.
- Deep Links verwenden validierte Suchparameter, beispielsweise `?tab=projektmanagement&view=liste&task=<uuid>`. Aufgabe muss zum Event passen; unzulässige Parameter ergeben eine verständliche Meldung.
- Serienvorlagen sind über die bestehende Seriennavigation des Events erreichbar. Der Editor zeigt klar „Gilt für künftige Übernahmen“.

### 5.2 Eventseite: sofort sichtbare Informationen

Der vorhandene Eventkopf mit Name, Eventcode, Datum, Eventstatus und Seriennavigation bleibt sichtbar. Direkt darunter stehen klickbare Kennzahlen: offene Aufgaben, überfällig, aktive Red Flags und blockiert. Red-Flag-Kennzahl zählt betroffene Aufgaben; Detailansicht nennt zusätzlich die Zahl einzelner Risiken. Kennzahlen sind überlappend und werden nicht zu einer Gesamtsumme addiert.

Es folgen die nächsten fünf kritischen Fälligkeiten mit „Alle anzeigen“ und Fortschritt je Bereich. Jede kritische Zeile enthält Titel, Datum, Verantwortlichen und Handlungsgrund. Ohne kritische Fristen wird ausdrücklich ein leerer Zustand angezeigt; kritische Aufgaben ohne Datum erscheinen in einer eigenen Warnliste.

Fortschritt je Bereich = erledigte Aufgaben / (alle Aufgaben minus stornierte Aufgaben), einschließlich einzeln archivierter erledigter Aufgaben. Beispiel: 6 erledigt, 3 offen, 1 storniert = 6/9 bzw. 67 %. Bei Nenner null steht „Keine aktiven Aufgaben“, nicht 100 %. Zusätzlich offene, blockierte und überfällige Zahl zeigen; Prozent allein verdeckt Risiken.

Die offene Liste folgt unmittelbar. „Abgeschlossen“ und „Historie“ sind direkt erreichbar, auch wenn ihre Inhalte erst beim Öffnen geladen werden. Event-Kennzahlen beziehen sich stets auf das ganze Event und sind als solche beschriftet; Listenfilter zeigen separat ihre Trefferzahl.

### 5.3 Ansichten

| Ansicht | Pflichtverhalten |
| --- | --- |
| Liste | Titel, Bereich, Aufgabenstatus, Verantwortlicher, Priorität, Frist, Risiko-/Blockierhinweise, nächster Schritt; global zusätzlich Event und Serie. Spalten wählbar, sortierbar; Metadaten im Detailpanel. |
| Kanban | Spalten Neu, In Arbeit, Wartet, Blockiert, Erledigt; Storniert optional. Karten zeigen Frist, Verantwortlichen, Bereich und Warnungen. Spaltenzahlen zählen alle Treffer, nicht nur geladene Karten. |
| Kalender | Monat/Woche, Tagesfristen als Ganztagseinträge, Uhrzeitfristen lokal eingeordnet; eigener Bereich „Ohne Fälligkeit“. Eventdatum nur als klar unterscheidbarer Orientierungseintrag. |
| Dashboard | Anzahl betroffener Events, Handlungsbedarf, überfällige/ungeklärte/kritische Aufgaben, Verantwortliche mit offenen Aufgaben und Fortschritt pro Event/Bereich. Jede Kennzahl öffnet ihre zugrunde liegende gefilterte Liste. |
| Abgeschlossen | Erledigt und Storniert getrennt erkennbar; Suche, Abschlussdatum, abgeschlossen durch, Ergebnis, Wiederöffnen und vollständige Historie. |

Das Dashboard ist eine Arbeitsübersicht; es bewertet ohne Aufwandsdaten weder Mitarbeitendenleistung noch tatsächliche Auslastung.

## 6. Globale Übersicht: Filter, Gruppierung und Sortierung

| Dimension | Filter | Gruppierung |
| --- | --- | --- |
| Event | Mehrfachauswahl per ID, Suche nach Name/Code | Event |
| Eventserie | Mehrfachauswahl, „Ohne Serie“ | Serie, darunter optional Event |
| Bereich | Mehrfachauswahl einschließlich nicht zugeordnet | Bereich |
| Verantwortlicher | Benutzer-IDs, „Ich“, „Nicht zugewiesen“, inaktive Benutzer | Verantwortlicher |
| Status | Mehrfachauswahl des sichtbaren Aufgabenstatus; offene als Preset | Sichtbarer Status |
| Priorität | Niedrig/normal/hoch/kritisch | Priorität |
| Fälligkeit | Überfällig, heute, nächste 7 Tage, eigener Bereich, ohne Datum | Überfällig/heute/nächste 7 Tage/später/ohne Datum |
| Red Flag | Alle/ja/nein; optional Schwere | Ja/nein |
| Überfällig | Alle/ja/nein | Ja/nein |
| Blockiert | Alle/ja/nein; manuell/Abhängigkeit | Ja/nein |

Filter zwischen Dimensionen sind UND-verknüpft, Werte innerhalb einer Dimension ODER-verknüpft. „Nein“ schließt nur den jeweiligen Zustand aus. Unmögliche Kombinationen zeigen null Treffer und erhalten die Filter. Höchstens zwei Gruppierungsebenen; Gruppen ohne Wert werden explizit angezeigt.

Global standardmäßig offene Aufgaben nicht archivierter Events, einschließlich vergangener und abgesagter Events mit Restarbeit. Ein sichtbarer Archivfilter erlaubt Archiv/alle; erledigte Aufgaben sind über den Statusfilter zugänglich. Zeitraum des Events und Fälligkeit der Aufgabe sind getrennte Filter.

Standardsortierung: kritische Aufgaben zuerst, danach überfällige, dann Fälligkeit aufsteigend, ohne Datum zuletzt; ID als stabiler Tie-Breaker. Manuelle Reihenfolge ist nur in einer expliziten manuellen Sortierung und innerhalb desselben Events zulässig.

Filter und Ansichtsmodus bleiben in der URL beim Reload und beim Zurücknavigieren erhalten. Persönliche gespeicherte Ansichten können später ergänzt werden; sie sind keine Voraussetzung für reproduzierbare Filterlinks. Globale Kennzahlen beachten den kompletten aktuellen Filter; die Bezeichnung nennt den Filterkontext.

## 7. Benutzerinteraktionen und Feedback

- **Erstellen:** „Aufgabe anlegen“ öffnet ein rechtes Sheet. Im Event ist das Event vorbelegt; global ist Eventauswahl Pflicht. Titel ist für schnelle Erfassung ausreichend. Nach Speichern bleibt die Aufgabe direkt bearbeitbar.
- **Bearbeiten:** Titel, Status, Verantwortlicher, Priorität und Frist sind in der Liste direkt editierbar; längere Inhalte, Abhängigkeiten, Risiken, Warte- und Lieferinformationen im Sheet. Fehler stehen am Feld, ungespeicherte Eingaben bleiben erhalten.
- **Verschieben:** Kanban-Drag oder Menü „Status ändern“ verwenden dieselben Serverregeln. Beim Verschieben nach Blockiert wird der Blockierungsdialog geöffnet. Aus Blockiert kann erst nach Beseitigung aller Blocker gewechselt werden; bei einem Abbruch springt die Karte zurück.
- **Frist verschieben:** Kalender-Drag oder Datumsfeld öffnet dieselbe Vorschau mit Pflichtbegründung. Bei Tagesfristen bleibt der Typ Tagesfrist erhalten. Ohne Bestätigung wird nichts gespeichert.
- **Filtern/Gruppieren:** sichtbare Filterchips, Trefferzahl und „Filter zurücksetzen“; die Leeransicht unterscheidet „Noch keine Aufgaben“ und „Keine Treffer“.
- **Kommentieren:** Kommentare mit Autor, Zeit und optionalen Referenzen. Eigene Kommentare können mit sichtbarer Revision korrigiert werden. Zurückziehen erzeugt einen Platzhalter; Audit und bisherige Revision bleiben erhalten. Textinhalt maximal 10.000 Zeichen.
- **Abschließen:** Ergebnisdialog prüft offene Risiken, Rückmeldungen, Blocker und Lieferstand. Fehler nennen das konkrete Hindernis samt Link. Nach Erfolg verschwindet die Aufgabe aus Offen und ist unter Abgeschlossen auffindbar.
- **Mehrbenutzerbetrieb:** Speichern zeigt ausstehend/erfolgreich/fehlgeschlagen. Versionskonflikte zeigen aktuelle Serverdaten und eigene Eingaben zum Vergleich; kein stilles Last-write-wins.
- **Mobil:** Karten statt breiter Pflichttabelle, Filter als Sheet, Detailpanel als Vollbild. Alle Aktionen per Tippen verfügbar. Browser-Zurück schließt zunächst das Detail und erhält Filter/Scrollposition.

## 8. Datenmodell

Alle nachfolgenden Tabellen/Felder sind Zieländerungen am vorhandenen Prisma-Modell. UUIDs als technische Identitäten; `createdAt`/`updatedAt` in UTC. Enumerationswerte sind stabile technische Codes, deutsche/englische Texte werden übersetzt.

### 8.1 Erweiterung `EventTask`

| Feld | Typ / Regel |
| --- | --- |
| `id`, `eventId`, `title` | Bestehende UUIDs/Referenz/Titel erhalten; Eventreferenz künftig gegen physisches Löschen schützen. |
| `description`, `nextAction` | Nullable Text, fachliche Pflicht je Übergang. |
| `workflowStatus` | Enum NEW/IN_PROGRESS/WAITING/DONE/CANCELLED. `effectiveStatus` nur berechnet. |
| `categoryId` | Nullable FK auf `TaskCategory`; null als nicht zugeordnet. |
| `assigneeId` | Nullable FK auf bestehenden `User`; interne Hauptverantwortung. |
| `priority`, `criticalReason` | Enum LOW/NORMAL/HIGH/CRITICAL; Begründung bei kritisch. |
| `dueKind`, `dueDate`, `dueAt`, `dueTimeZone` | NONE/DATE/INSTANT; Datum als SQL DATE, Zeitpunkt als UTC; exakt passende Felder gefüllt. |
| `scheduleAnchor`, `offsetDays`, `localDueTime`, `scheduleMode`, `lastCalculatedDue` | Optionaler Bezug zu Eventstart/-ende; Modus RELATIVE/MANUAL; Herkunft und letzte Berechnung für Terminverschiebung. |
| `delayReason` | Nullable Text; dokumentierter Verzögerungsgrund. |
| `completedAt`, `completedById`, `completionNote` | Letzter Abschluss, bei Wiederöffnen aktueller Abschluss leer; alter Abschluss im Audit. Für Altbestand darf Abschlusszeit/-autor unbekannt bleiben. |
| `cancelledAt`, `cancelledById`, `cancellationReason` | Stornoinformationen; frühere Stornos bleiben im Audit. |
| `archivedAt`, `archivedById` | Optionale Archivierung terminaler Aufgaben. |
| `templateId`, `templateRevisionId`, `instantiationId`, `sourceTaskId` | Optionale Herkunft; stabile Vorlage plus konkrete Revision und Übernahmelauf. |
| `version`, `sortRank`, `createdById`, `updatedById` | Optimistische Sperre, manuelle Reihenfolge, Akteure aus Session. |
| `legacyResponsible`, `legacyCompleted` | Temporär/archivarisch bewahrte Originalwerte; keine zweite aktive Statusquelle. |

`completed` wird nach der Migration nicht unabhängig beschrieben. Während der Kompatibilitätsphase ist es ausschließlich aus `workflowStatus === DONE` abgeleitet. `responsible` wird durch die Benutzerreferenz abgelöst, der Originaltext bleibt nachweisbar.

### 8.2 Neue relationale Modelle

| Modell | Schlüssel und Kernfelder |
| --- | --- |
| `EventSeries` | id = bestehende seriesId, name, active, version, Zeitstempel; 1:n Events und Vorlagen. Keine Pflicht „genau ein Event je Kalenderjahr“, da ein Serienjahr mehrere Termine haben kann. |
| `TaskCategory` | id, eindeutiger stabiler key, nameDe, nameEn, active, sortOrder; referenzierte Bereiche nur deaktivieren. |
| `TaskWaitEpisode` | id, taskId, expectedResponse, contactId optional, partyText optional, requestedAt, followUpDate, resolvedAt, result, actor; höchstens eine ungelöste Episode pro Aufgabe. |
| `TaskBlocker` | id, taskId, reason, unblockAction, ownerId, createdBy/At, resolvedBy/At, resolution; historische Zeilen bleiben erhalten. |
| `TaskRisk` | id, taskId, severity, description, impact, mitigation, ownerId, createdBy/At, resolvedBy/At, resolution. |
| `TaskDependency` | id, eventId, predecessorId, successorId, createdBy/At; aktive Kante eindeutig; Entfernen im Audit mit Grund. |
| `TaskComment` und `TaskCommentRevision` | Kommentar-ID, taskId, authorId, Zeitstempel; Revision mit fortlaufender Nummer, body, editedBy/At und Rückziehgrund. |
| `TaskReference` | id, taskId und genau eine FK auf `Contact`, `EventActivity`, `EventCommunicationMessage`, `EventFile`, `HardwareIssue` oder `Payout`; Beziehungstyp und Akteur. |
| `TaskDelivery` | id, taskId, direction OUTBOUND/INBOUND, status, recipientContactId optional, recipientSnapshot optional, carrier, trackingNumber, trackingUrl, quantityExpected, quantityReceived, shippedAt, expectedDate, deliveredAt, issueReason. 1:n je Aufgabe für Teillieferungen. |
| `SeriesTaskTemplate` | id, seriesId, active, currentRevisionId; stabile Identität. |
| `SeriesTaskTemplateRevision` | id, templateId, revision, unveränderlicher Snapshot der Planfelder, createdBy/At. |
| `SeriesTemplateDependency` | Vorgänger-/Nachfolgervorlage innerhalb derselben Serie; Bestandteil der versionierten Übernahmevorschau. |
| `TaskInstantiation` | id, eventId, seriesId, idempotencyKey, requestHash, gewählte Revisions-/Abhängigkeits-Snapshots, createdBy/At, resultTaskIds. |

`Event` wird um `timeZone` und die echte Relation zu `EventSeries` erweitert. Die Aufgabe erhält keine unabhängig editierbare aktuelle `seriesId`; eine Serienherkunft wird nur im Übernahmenachweis gespeichert.

### 8.3 Referenzen und Lieferstatus

Referenzen auf Mail, Aktivität, Datei oder Hardware müssen zum gleichen Event gehören. Kontakte stammen aus dem bestehenden CRM; Verknüpfen mit einer Aufgabe legt keine zweite Person an und ändert keine Eventrolle automatisch. Ein `Payout` kann optional verknüpft werden, sein Zahlungsstatus bleibt ausschließlich im Finanzmodul maßgeblich. Verknüpfte Hardware-Rückgaben behalten ihren Lebenszyklus im Hardwaremodul.

Lieferstatus je Sendung: `PLANNED` → `READY` → `SHIPPED` → `PARTIALLY_DELIVERED` → `DELIVERED`; alternativ `ISSUE` und `CANCELLED`. Direkte bestätigte Zustellung ohne vorherige Versandbuchung ist mit Begründung erlaubt. Problemstatus verlangt Grund und nächsten Schritt. Mengen müssen positiv beziehungsweise empfangen ≥ 0 und ≤ erwartet sein; abweichende Mehrlieferung erfordert zunächst eine begründete Mengenanpassung.

Aufgabenstatus und Lieferstatus sind getrennt: „Versendet“ ist noch nicht „Erledigt“. Eine Lieferaufgabe darf erledigt werden, wenn alle nicht stornierten Sendungen zugestellt und die Zielmengen erreicht sind. Sind alle Sendungen storniert, wird die Aufgabe storniert oder durch explizite fachliche Umklassifizierung mit Begründung beendet. Im Erstumfang erfolgt Lieferpflege manuell; Zeitstempel und Änderungen sind nachvollziehbar. Trackinglinks werden als sichere HTTP(S)-Links validiert, nicht serverseitig ungeprüft abgerufen.

### 8.4 Integrität und Indizes

FKs schützen Event-, Benutzer-, Vorlagen- und Historienbezüge; Benutzer werden gemäß bestehendem Rollenmodell deaktiviert. Für PM-Daten gilt kein stilles `onDelete: Cascade` vom Event. Ein Event mit PM-Aufgaben darf nicht physisch gelöscht werden (`409 EVENT_HAS_PROJECT_HISTORY`); Archivierung ist der reguläre Weg. Das ändert den bestehenden Event-Löschpfad bewusst und benötigt dessen Regressionstest.

Unique-Indizes: `(eventId, templateId)` für Instanzen mit Vorlage, `(templateId, revision)`, aktive Abhängigkeitskante, `(eventId, idempotencyKey)`, `(commentId, revision)`. Partielle Unique-/Check-Constraints erforderlichenfalls als SQL-Migration: aktive Warteepisode, konsistente Fristfelder, nichtnegative Mengen, keine Selbstkante. Eventgleichheit der Abhängigkeiten durch zusammengesetzte FKs oder transaktional gesperrte Validierung absichern.

Abfrageindizes: `(eventId, workflowStatus)`, `(assigneeId, workflowStatus)`, `(categoryId, workflowStatus)`, Fristindizes auf offenen Aufgaben, `(taskId, resolvedAt)` für Risiken/Blocker, beide Richtungen der Abhängigkeiten, `(taskId, createdAt, id)` für Kommentare. Vorläufige Auswahl durch Query-Pläne und Lasttests verifizieren.

## 9. Rollen und Berechtigungen

Es gilt das bestehende [interne Benutzer-/Admin-Modell](../decisions/2026-09-09-systembenutzer-und-berechtigungen.md). „Benutzer“ entspricht im aktuellen Schema `MITARBEITER`. Alle aktiven internen Benutzer arbeiten in derselben Organisation; keine neu erfundenen Projektmitgliedschaften.

| Aktion | Benutzer | Admin |
| --- | --- | --- |
| Aufgaben, Kommentare, Historie aller Events lesen | Ja | Ja |
| Aufgaben erstellen, zuweisen, bearbeiten, abschließen, wiederöffnen | Ja | Ja |
| Risiken/Blocker pflegen und begründet auflösen | Ja | Ja |
| Serienvorlagen pflegen und übernehmen | Ja | Ja |
| Eigene Kommentare revidieren/zurückziehen | Ja | Ja |
| Fremde Kommentare moderieren | Nein | Ja, mit Grund und Historie |
| Bereiche/Systemeinstellungen/Benutzer verwalten | Nein | Ja |
| Terminale Aufgaben archivieren | Ja | Ja |
| Events archivieren/reaktivieren | Nein | Ja, Offen-Prüfung bleibt Pflicht |
| Audit verändern oder PM-Historie regulär löschen | Nein | Nein |

Zuweisung ist Verantwortung, keine exklusive Bearbeitungserlaubnis. Deaktivierte Konten bleiben historisch sichtbar und werden als Problem für offene Aufgaben markiert; neue Zuweisung ist verboten. Externe Kontakte haben keinen Loginzugang. Jede Mutation prüft Session, Rechte, Ressourcenzugehörigkeit und Archivstatus serverseitig.

## 10. Transparenz und Nachvollziehbarkeit

Die Aufgabendetailansicht bündelt Verantwortlichen, nächsten Schritt, Frist und Verzögerungsgrund, ausstehende Rückmeldung, Blockierungsursachen, Risiken, Abhängigkeiten und operative Referenzen. Leere Pflichtinformationen werden nicht durch erfundene Werte ersetzt.

Der bestehende `AuditLog` bleibt die einzige technische Änderungsquelle. Für jede erfolgreiche fachliche Mutation werden Aufgabe/Kindobjekt und Audit in derselben Transaktion geschrieben. Ein Eintrag enthält Akteur aus Session, UTC-Zeit, Aktion, taskId, eventId, betroffene Felder mit vorher/nachher, Begründung, Korrelations-ID und gegebenenfalls Vorlagenrevision. Unterobjektänderungen werden im Aufgabenverlauf gemeinsam chronologisch dargestellt. Anzeige sortiert stabil nach Zeit und ID.

Geänderte Kommentare zeigen „bearbeitet“ samt abrufbaren Revisionen. Auflösen von Risiken, Fristverschiebung, Zuweisung, Statuswechsel, Wiederöffnen, Vorlagenübernahme und Serienwechsel sind nachvollziehbar. Historische Benutzernamen können als Snapshot zusätzlich zur Konto-ID gespeichert werden, damit Umbenennungen nicht die damalige Darstellung verwischen.

Berechnete Zeitereignisse wie „seit heute überfällig“ werden aus Frist und Zeitpunkt erklärt; es entsteht nicht minütlich ein Auditdatensatz. Fehlerhafte Mutationen erzeugen keine scheinbar erfolgreichen fachlichen Einträge; technische Fehler werden separat protokolliert. Der Aufgabenverlauf erhält einen paginierten, autorisierten Lesezugang statt des unbeschränkten allgemeinen Audit-Listenabrufs.

## 11. Nicht-funktionale Anforderungen

| Bereich | Abnahmeziel |
| --- | --- |
| Bedienbarkeit | Standardaufgabe im Event über einen sichtbaren Button anlegen; Titel ohne weitere Pflichtdialoge speicherbar. Status/Risiken textlich verständlich, keine reine Farbsemantik. |
| Performance | Auf dokumentierter Staging-Referenz mit 1.000 Events, 100.000 Aufgaben, 1 Mio. Auditzeilen und 20 gleichzeitigen Benutzern: p95 Listen-/Filter-API ≤ 500 ms, Mutationen ≤ 800 ms, Dashboard ≤ 1 s; keine externe Synczeit eingerechnet. Erste nutzbare Listenansicht im Browser ≤ 2 s bei 100 ms RTT und 10 Mbit/s. Messumgebung und Cachezustand dokumentieren. |
| Skalierung | Serverseitige Filter/Aggregate und Cursorpagination, Standard 50/maximal 200 Zeilen; kein Laden aller Eventdetaildaten für globale Aufgaben. Kommentare und Historie separat laden. |
| Aktualität | Eigene Änderungen sofort nach bestätigter Antwort konsistent anzeigen; andere Benutzeränderungen spätestens nach 30 s bei aktiver Ansicht oder beim Fokuswechsel. Kein Offline-Schreiben im Erstumfang. |
| Mobil | Kernabläufe bei 360 px Breite vollständig nutzbar; keine horizontale Seitennavigation nötig. Detailinhalte umbrechen. |
| Barrierefreiheit | Sämtliche Aktionen per Tastatur, sichtbarer Fokus, beschriftete Felder/Icons, Fokusführung im Sheet, Screenreader-Statusmeldungen. Drag-and-drop immer zusätzlich über Menü/Buttons bedienbar; Touchziele mindestens 44 × 44 CSS-Pixel. Textkontrast mindestens 4,5:1, Risiken zusätzlich mit Text/Icon. Bei 200 % Zoom bleibt Bedienung möglich. |
| Internationalisierung | Bestehende de/en-Infrastruktur; neue Texte ausschließlich Übersetzungsschlüssel, deutsche Vorgabe. Nutzerinhalte nicht automatisch übersetzen. API-Enums stabil, Datums-/Zahlenanzeige lokalisiert; Zeitzone ausdrücklich und unabhängig von Sprache behandeln. |
| Integrität | Versionsprüfung, FK-/Check-/Unique-Regeln, atomare Auditierung, idempotente Übernahmen, Zyklusprüfung unter Konkurrenz; keine verlorenen Änderungen. |
| Sicherheit | Bestehende Sessionauthentifizierung, zusätzlicher Rechtecheck, Eingabegrenzen und sichere Textdarstellung. Sessionbasierte Mutationen gegen Cross-Site-Aufrufe absichern. Keine Zugangsdaten oder vollständigen Mailinhalte in Auditkopien. |
| Betrieb | Migration vor Appfreigabe, Backup samt erprobtem Restore im Staging, strukturierte Logs mit Korrelations-ID, Metriken für Fehler/Versionskonflikte/Antwortzeiten. Vorläufige Betriebsziele RPO 24 h, RTO 4 h mit Betreiber bestätigen. |

## 12. Technische Anforderungen und Integration

### 12.1 Architektur und Wiederverwendung

Die Umsetzung bleibt im vorhandenen React-/TanStack-Frontend und NestJS-Event-Service mit Prisma/PostgreSQL, belegt durch [Frontend-Paket](../../package.json) und [Service-Paket](../../services/event-service/package.json). Es entsteht kein separat deployter PM-Service und keine zusätzliche Datenbank.

| Vorhanden | Geplante Verwendung/Änderung |
| --- | --- |
| [Event-Workspace](../../src/lib/t2w/event-workspace.ts), [Detail-Workspace](../../src/lib/t2w/event-detail-workspace.ts) | Eventidentität, Navigation, Kopieren und Serienanbindung weiter nutzen; PM erhält einen eigenen zusammenhängenden Workspace für Query/Mutationsstatus. Ungespeicherte Stammdaten nicht durch Taskantworten überschreiben. |
| [API-Adapter](../../src/lib/t2w/api.ts), [Typen](../../src/lib/t2w/types.ts), `@t2w/domain` | Task-DTOs und gemeinsame Fachregeln ergänzen; `Task` nicht weiter auf Checkboxmodell reduzieren. Gemeinsame Zeit-/Statusregeln von Server und Anzeige nutzen. |
| [TableFeatures](../../src/components/t2w/TableFeatures.tsx), [Tabellenmodell](../../src/components/t2w/table-model.ts), `components/ui` | Tabellenkonventionen, Filter, Sortierung, Sheet, Dialog, Formularfelder und Buttons wiederverwenden; keine neue visuelle Designsprache. |
| [Locale-Rendering](../../src/lib/locale-rendering.ts), [i18n](../../src/lib/i18n.tsx) | Übersetzungen erweitern; explizite Eventzeitzone und Zeitpunktformat ergänzen, bisheriges date-only Formatting nicht für alle Fristen verwenden. |
| [Kommunikationsmodul](../../services/event-service/src/outlook/event-communication.hub.ts), [Timeline](../../src/lib/t2w/communication-timeline.ts) | Vorhandene Mails/Aktivitäten auswählen und verlinken; keine PM-eigene Mailkopie oder automatische Synchronisationspflicht. |
| [AuditService](../../services/event-service/src/audit.service.ts) | Transaktionswriter, paginierte Aufgabenhistorie, taskId/eventId-Konvention ergänzen. |

Neue vorgeschlagene Module: `packages/domain/src/project-management/` für Status-/Frist-/Übergangsregeln, `project-management.service.ts` und Prisma-Adapter für transaktionale Befehle, eigener Query-Service für Listen/Aggregate, `task-templates.service.ts` für Vorschau und Instanziierung. Registrierung im vorhandenen Event-Service-Modul.

Neue UI-Komponenten unter `src/components/t2w/project-management/`: `EventProjectManagement`, `TaskList`, `TaskBoard`, `TaskCalendar`, `TaskDetailSheet`, `TaskFilters`, `TaskSummary`, `TaskHistory`, `SeriesTemplateEditor`, `TemplateApplyPreview`. Das sind geplante Dateinamen, keine vorhandenen Dateien. Beide Routen nutzen dieselben Taskkomponenten und Regeln mit unterschiedlichem Scope.

Eventlisten und Startdashboard müssen auf denselben serverseitig berechneten Aufgabensummen aufbauen. Die bisherige clientseitige globale Projektion darf nicht weiter als vollständige Datenbasis gelten, wenn nur eine Eventseite geladen wurde.

### 12.2 API-Vertrag

Alle Pfade relativ zu `/api/v1`; JSON, authentifiziert. IDs sind UUIDs. Fachliche Aktionen werden als einheitliche Befehle serverseitig ausgeführt, unabhängig von Liste, Kanban oder Kalender.

| Methode/Pfad | Zweck |
| --- | --- |
| `GET /tasks` | Globale paginierte Suche mit Filtern aus Abschnitt 6, sort/groupBy, cursor, limit. |
| `GET /tasks/summary` | Vollständige Filteraggregate, Gruppen, kritische Fristen; keine Summierung nur der aktuellen Seite. |
| `GET /events/:eventId/tasks` | Eventliste mit identischem Filtervertrag. |
| `POST /events/:eventId/tasks` | Bestehenden Pfad erweitern: Aufgabe anlegen. |
| `GET /events/:eventId/tasks/:taskId` | Detail mit aktuellen Risiken, Blockern, Warte-/Lieferdaten und Referenzen. |
| `PATCH /events/:eventId/tasks/:taskId` | Bestehenden Pfad erweitern: Planfelder, expectedVersion, Änderungsgrund bei Frist/Priorität. |
| `POST /events/:eventId/tasks/:taskId/actions` | `start`, `wait`, `complete`, `cancel`, `reopen`, `archive`, `unarchive`; typisierte Payload und expectedVersion. |
| `POST /events/:eventId/tasks/:taskId/comments` | Kommentar erstellen; Client-Request-ID verhindert Retry-Duplikate. |
| `PATCH /events/:eventId/tasks/:taskId/comments/:commentId` | Eigene Revision beziehungsweise begründete Adminmoderation mit Kommentarversion. |
| `GET /events/:eventId/tasks/:taskId/comments` bzw. `/history` | Getrennte Cursorpagination. |
| `POST/PATCH /events/:eventId/tasks/:taskId/risks[/:riskId]` | Risiko anlegen/ändern/auflösen. |
| `POST/PATCH /events/:eventId/tasks/:taskId/blockers[/:blockerId]` | Manuelle Blockierung anlegen/auflösen. |
| `POST /events/:eventId/tasks/:taskId/dependencies` | Vorgänger verbinden. |
| `DELETE /events/:eventId/tasks/:taskId/dependencies/:dependencyId` | Mit expectedVersion und Grund entfernen. |
| `POST/PATCH /events/:eventId/tasks/:taskId/deliveries[/:deliveryId]` | Sendungs-/Lieferinformationen pflegen. |
| `POST/DELETE /events/:eventId/tasks/:taskId/references[/:referenceId]` | Bestehende fachliche Objekte verbinden/lösen. |
| `GET/POST /event-series/:seriesId/task-templates` | Aktive Vorlagen lesen/anlegen. |
| `PATCH /event-series/:seriesId/task-templates/:templateId` | Neue Revision erstellen oder deaktivieren, erwartete Vorlagenversion. |
| `POST /events/:eventId/task-template-preview` | Revisionsgebundene Vorschau mit Terminen und Prüfhinweisen. |
| `POST /events/:eventId/task-template-applications` | Bestätigte Auswahl idempotent instanziieren. |
| `POST /events/:eventId/task-reschedule-preview` bzw. `/task-reschedule` | Vergleich und bestätigte atomare Anpassung relativer Fristen. |
| `GET/POST/PATCH /task-categories[/:id]` | Lesen für Benutzer, Verwaltung für Admin. |

Eckige Pfadteile in dieser Tabelle kennzeichnen Collection-/Itemvarianten, keine wörtlichen URL-Zeichen. Detail-GET liefert Referenzen und operative Kinder; deren Änderungen liefern die aktualisierte Aufgabe einschließlich berechneter Zustände.

Listenparameter beispielsweise `eventId[]`, `seriesId[]`, `categoryId[]`, `assigneeId[]`, `status[]`, `priority[]`, `redFlag`, `overdue`, `blocked`, `dueFrom`, `dueTo`, `dueMissing`, `archive`, `q`. Datumsintervalle sind fachlich inklusive Enddatum; der Server wandelt sie je Eventzone in exklusive Grenzen des Folgetages um. Abfragen liefern `{items, nextCursor, total, asOf}`; Aggregate denselben `asOf`-Bezug. Status-/Risikosummen und Datumsflags werden serverseitig mit einer injizierbaren Uhr berechnet.

Mutationen liefern `{task, version}`; Erstellung zusätzlich HTTP 201, Lesen/Ändern 200, erfolgreiches Entfernen einer Referenz 204. 400 für ungültige Typen/Werte, 401 für fehlende Session, 403 für fehlendes Recht, 404 für fehlende oder nicht zum Event gehörende Ressource, 409 für Versions-/Zyklus-/Historienkonflikt, 422 für fachlich unvollständigen Übergang. Fehlerkörper: `{code, messageKey, fieldErrors, currentVersion?}`. Unbekannte Felder werden zurückgewiesen.

### 12.3 Konkurrenz, Konsistenz und Kompatibilität

Jede Taskmutation prüft atomar `expectedVersion`, erhöht `EventTask.version` und schreibt den Audit. Änderungen an Risiken/Blockern/Lieferungen erhöhen ebenfalls die Taskversion. Kommentarrevisionen verwenden ihre eigene Version, damit unabhängiges Kommentieren nicht laufende Planbearbeitung blockiert.

Abhängigkeitsänderungen und Vorlageninstanziierung sperren den betroffenen Event-Plan transaktional. Innerhalb derselben Sperre werden Graph, Zugehörigkeit und Abschlussbedingungen geprüft. Auch konkurrierendes Erledigen/Wiederöffnen muss diese Regeln einhalten. Idempotency-Key plus Requesthash: identische Wiederholung liefert ursprüngliche IDs, derselbe Key mit anderer Payload ergibt 409.

Die bisherige Eventversionsprüfung darf beim Umbau nicht unbemerkt entfallen. Übergangsweise akzeptiert der bestehende Controller den alten DTO-Vertrag, leitet jedoch in dieselben neuen Fachbefehle und gibt weiterhin ein Event zurück. Neues Frontend sendet einen expliziten Vertragsmarker `X-T2W-Task-Contract: 2`, nutzt `expectedVersion` und erhält Taskantworten. Legacy-`completed` darf Abschlussprüfungen nicht umgehen. Nach gemeinsamer Auslieferung und dokumentierter Übergangsfrist wird der Adapter entfernt.

Taskantworten aktualisieren gezielt den Taskcache und invalidieren Event-/globale Summen; sie ersetzen keinen Eventformularentwurf. Eventmetadatenversion und Taskversion werden getrennt behandelt. Ein Event speichern darf niemals eine veraltete vollständige Aufgabenliste zurückschreiben.

### 12.4 Migration und Einführung

1. Datenbestand sichern; neue Tabellen und nullable Felder additiv bereitstellen. Bestehende `seriesId`-Werte unverändert als `EventSeries.id` anlegen; Serienname aus Eventnamen nur als prüfbarer Vorschlag. Keine Namen als neue Identität verwenden.
2. Bestehende Aufgaben-IDs/Eventbezüge erhalten. `completed=true` auf DONE, sonst NEW abbilden. `responsible` als Originaltext bewahren; keine unsichere Namenszuordnung. Exakte bestätigte Benutzerzuordnung separat durchführen.
3. Vorhandenes `dueAt` unverändert sichern. Da die UI bisher nur ein Datum darstellt, muss eine Datenprüfung zwischen tatsächlichem Zeitpunkt und Tagesfrist unterscheiden. Ohne sicheren Nachweis als INSTANT mit erhaltenem UTC-Wert übernehmen und zur Fristprüfung markieren; keine stille Zeitzonenverschiebung.
4. Keine Abschlussbenutzer/-zeit erfinden: Altbestand mit „vor Einführung erledigt; Zeitpunkt/Person unbekannt“. Migration als Systemaktion mit Run-ID protokollieren, ursprüngliche Zeitstempel erhalten.
5. Aufgaben- und Auditanzahlen, Serienbeziehungen und Fristwerte vor/nach Migration vergleichen; neues FK-/Löschverhalten und Constraints aktivieren, sobald der angepasste Event-Löschpfad bereitsteht.
6. Eventansicht/globalen Bereich samt Testdaten in Staging prüfen. Dann kontrolliert für Benutzer freigeben. Vorlagen zunächst bewusst aus fachlich geprüften Standards erstellen.
7. Rollback: neue Oberfläche deaktivieren, Daten erhalten; keine destruktive Rückmigration auf das Checkboxmodell nach produktiven PM-Schreibvorgängen. Backend bei Bedarf vorwärts korrigieren; Backup-Restore nur nach bewusstem Abgleich inzwischen erfolgter Änderungen.

Empfohlene Lieferreihenfolge: Daten-/Rechteschutz und Aufgabenliste → Risiken/Wartefälle/Abhängigkeiten/Historie → Serienvorlagen → globale Aggregate, Board und Kalender → Last-, Mobile- und Zugänglichkeitsabnahme. Jedes Inkrement enthält seine eigenen Regressionstests.

## 13. Konkrete Akzeptanzkriterien

Die Kriterien sind als Given/When/Then-Szenarien formuliert. UI-Szenarien müssen gegen den realen Service und persistente Testdaten laufen; ein Reload ist kein Mock-Store-Reset.

| ID | Voraussetzung und Aktion | Erwartetes beobachtbares Ergebnis |
| --- | --- | --- |
| AK-01 | Event A öffnen, Titel erfassen und speichern, Seite neu laden. | Eine neue Aufgabe mit gleicher ID in Event A, Status Neu; Event B enthält sie nicht. |
| AK-02 | Aufgabe mit Bereich/aktivem User/nächstem Schritt bearbeiten und auf In Arbeit setzen. | Alle Werte nach Reload gleich; Autor/Zeit und Feldänderungen in Historie. |
| AK-03 | In Arbeit ohne Verantwortlichen setzen. | 422 mit Feldhinweis, bisheriger Status und Daten bleiben erhalten. |
| AK-04 | Wartestatus mit Kontakt, erwarteter Antwort und Wiedervorlage setzen. | Fehlende Antwort ist sichtbar, Kontakt öffnet vorhandenen CRM-Datensatz; Nachrichtenzuordnung erzeugt keine Dublette. |
| AK-05 | Manuelle Blockierung anlegen, anschließend im Board nach Erledigt ziehen. | Karte bleibt blockiert; konkreter Grund wird angezeigt. Nach begründeter Lösung ist vorheriger Arbeitsstatus wieder sichtbar. |
| AK-06 | A als Vorgänger von B anlegen, dann B als Vorgänger von A versuchen. | Zyklus wird abgelehnt; B bleibt durch A blockiert. Auch zwei konkurrierende Gegenkanten können nicht beide gespeichert werden. |
| AK-07 | A erledigen, B erledigen, anschließend A wiederöffnen. | Konflikt nennt erledigten Nachfolger B; kein inkonsistenter Graph. |
| AK-08 | Aufgabe erledigen, Ergebnis erfassen, neu laden. | Nicht mehr in Offen, unter Abgeschlossen mit Ergebnis/Benutzer/Zeit vorhanden; Kommentarhistorie erhalten. |
| AK-09 | Erledigte Aufgabe begründet wiederöffnen. | Wieder offen; ursprünglicher Abschluss und Wiederöffnung bleiben im Verlauf. |
| AK-10 | Lieferaufgabe mit zwei Sendungen, eine nur teilweise zugestellt, abschließen. | Abschluss abgelehnt. Nach vollständiger Zustellung beider Sendungen möglich; Versand allein genügt nicht. |
| AK-11 | Serie mit zwei abhängigen Vorlagen für neues Event übernehmen. | Zwei neue IDs, berechnete Fristen und neue eventinterne Kante; alte Aufgaben/Kommentare/Abschlüsse unverändert. |
| AK-12 | Identische Übernahme zweimal sowie parallel ausführen. | Genau eine Instanz je Vorlage/Event; Wiederholung liefert ursprüngliche IDs. |
| AK-13 | Vorlage nach Übernahme ändern und erneut übernehmen. | Bestehende Instanz bleibt unverändert; neuer Jahres-Event erhält neue Revision. |
| AK-14 | Eventstart verschieben; eine relative offene, eine manuell datierte und eine erledigte Aufgabe existieren. | Vorschau nennt nur zulässige relative Anpassung; erst Bestätigung ändert sie, andere Fristen bleiben gleich. |
| AK-15 | Global Eventserie + Bereich + Verantwortlichen filtern und Link neu laden. | Gleiche Treffer/Filter; Aufgaben aus anderen Kombinationen fehlen; Gruppensummen umfassen alle Seiten. |
| AK-16 | Mehr als eine Seite Aufgaben und mehr Events als bisherige Eventlistengrenze bereitstellen. | Globale Suche findet auch Aufgaben nicht zuvor geladener Events; keine fehlenden oder doppelten Cursorzeilen bei unverändertem Datenstand. |
| AK-17 | Uhr auf 10.09.2026 in Europe/Vienna setzen; Aufgabe ohne Frist, Tagesfrist 10.09., Tagesfrist 09.09. vorhanden. | Ohne Frist nie überfällig; 10.09. erst ab lokalem 11.09. 00:00; 09.09. bereits überfällig. Unterschiedliche Browserzonen ändern Ergebnis nicht. |
| AK-18 | Zeitfrist exakt erreichen und Uhr über einen Sommerzeitwechsel führen. | Zeitpunkt ab Fristgrenze überfällig; Tagesfrist folgt lokalem Kalendertag, nicht pauschal 24 h. Erledigte/stornierte Aufgaben bleiben nicht überfällig. |
| AK-19 | Überfällige Aufgabe ohne Risiko und zukünftige Aufgabe mit aktivem Risiko anlegen. | Erste nur überfällig, zweite Red Flag; Filter/Badges und Erklärungen bleiben getrennt. |
| AK-20 | Risiko auflösen und Frist mit Grund verschieben. | Aktuelles Risiko-/Überfälligkeitsflag neu berechnet, alte Werte und Gründe im Verlauf sichtbar. |
| AK-21 | Bereich mit 6 erledigten, 3 offenen, 1 stornierter Aufgabe öffnen. | Fortschritt 6/9 bzw. 67 %, separat 1 storniert; Filter verändern unbeschriftete Gesamtsummen nicht. |
| AK-22 | Zwei Benutzer bearbeiten dieselbe Taskversion. | Erste Änderung gespeichert, zweite 409; Vergleich verfügbar, erste Änderung wird nicht überschrieben. |
| AK-23 | Audit-Schreiben in einer Testtransaktion fehlschlagen lassen. | Gesamte Mutation zurückgerollt; Aufgabe unverändert, keine Erfolgsmeldung. |
| AK-24 | Aufgabe aus Event A über URL von Event B ändern; Benutzer versucht Kategorieverwaltung. | 404 beziehungsweise 403; keine Datenänderung. Deaktiviertes Konto erhält keinen Zugriff. |
| AK-25 | Event mit offener Aufgabe archivieren oder Event mit PM-Historie löschen. | Archivierung beziehungsweise Löschen abgelehnt; Historie bleibt erreichbar. Terminales Event kann Admin archivieren und wieder aktivieren. |
| AK-26 | Kommentar bearbeiten/zurückziehen, Benutzer später deaktivieren. | Revisionen/Platzhalter und Autoridentität bleiben; keine Änderung am Audit möglich. |
| AK-27 | Liste/Board/Kalender nur mit Tastatur bzw. bei 360 px bedienen. | Anlegen, Statuswechsel, Friständerung, Filter und Abschluss ohne Drag-Zwang möglich; Fokus kehrt nach Sheet-Schließen sinnvoll zurück. |
| AK-28 | Sprache de → en wechseln und direkt auf eine Aufgabe verlinken. | UI-Texte übersetzt, Frist/Zeitzone fachlich gleich; Aufgabe öffnet sich im richtigen Event, Zurück erhält Filter. |
| AK-29 | Bestehende Checkboxaufgaben migrieren. | IDs, Originalzuständigkeit und Fristwerte erhalten; unbekannte Abschlussdaten als unbekannt, keine erfundene Historie. |
| AK-30 | Global editieren und Eventansicht erneut öffnen; parallel ungespeicherte Stammdaten halten. | Bestätigte Aufgabe und Summen aktuell; Stammdatenentwurf nicht überschrieben. |

Testebenen: Domain-/Service-Tests für Zeitgrenzen, Statusregeln, Abhängigkeiten und Migration; PostgreSQL-Integrationstests für Transaktionen, konkurrierende Befehle und Constraints; dauerhafte Playwright-E2E-Tests für vollständige Arbeitsabläufe einschließlich Reload. Neue Features werden gemäß Repositoryregel erst mit bestandenem relevantem Browserregressionstest abgeschlossen. Vorgeschlagene Suites: `project-management.spec.ts`, `project-management-series.spec.ts`, `project-management-global.spec.ts`; bestehende Event-, Kommunikations-, Benutzer- und Löschtests bei betroffenen Abläufen anpassen. Diese Spezifikation selbst implementiert oder testet noch kein Produktfeature.

## 14. Offene Fragen und konkrete Lösungsvorschläge

| Frage | Vorschlag für die Umsetzung | Auswirkung bei abweichender Entscheidung |
| --- | --- | --- |
| Wer darf Serienstandards ändern? | Interne Benutzer; Änderungen revisioniert. Admin nur für Stammdatenverwaltung. | Gesondertes Vorlagenrecht, falls fachliche Freigabe verlangt wird. |
| Ist ein einzelner Hauptverantwortlicher ausreichend? | Ja; externe Beteiligte über Kontakte/Kommentare. | Zusätzliche Mitwirkendenrelation, weiterhin genau ein accountable Owner. |
| Welche Zeitzonen und Fristtypen werden tatsächlich benötigt? | Eventzone mit Europe/Vienna als Vorgabe; Tagesfristen und genaue Zeitpunkte unterstützen. | Migration der Altfristen vor Freigabe fachlich prüfen. |
| Müssen Fristen Arbeitstage berücksichtigen? | Zunächst Kalendertage, Wochenendhinweis in Vorschau. | Eigener Betriebskalender mit Feiertagen und explizitem Verschiebungsverhalten. |
| Sollen kritische überfällige Aufgaben automatisch Red Flags werden? | Nein; automatische Überfälligkeit und bewusst gesetztes Risiko getrennt. | Eigenständige versionierte Eskalationsregel und Herkunft „automatisch“ erforderlich. |
| Darf ein erledigter Task aktive Risiken behalten? | Nein; Risiko bewusst lösen oder separate offene Folgeaufgabe anlegen. | Sonst gesonderte globale Sicht auf Risiken abgeschlossener Aufgaben nötig. |
| Sind Abhängigkeiten zwischen Events erforderlich? | Erstumfang eventintern. | Später eventübergreifende Sperr-/Archivierungsregeln und Navigation definieren. |
| Welche Daten dürfen archiviert oder endgültig gelöscht werden? | PM-Historie durch Archivierung erhalten; physisches Eventlöschen bei PM-Daten sperren. | Abweichende Aufbewahrungs-/Löschregeln müssen ausdrücklich entschieden und auf Audit/Backups abgestimmt werden. |
| Sollen Statuswerte je Serie anpassbar sein? | Fester gemeinsamer Statusautomat; Bereiche konfigurierbar. | Frei konfigurierbare Status brauchen Abbildung auf gemeinsame Semantik für globale Kennzahlen. |
| Braucht es aktive Benachrichtigungen? | UI-Wiedervorlage und Dashboard im Umfang; E-Mail/Push separat. | Zustellpräferenzen, Duplikatvermeidung und Versandnachweis ergänzen. |
| Müssen Vorjahresaufgaben massenhaft kopiert werden? | Versionierte Vorlagen und bewusste Einzelübernahme in Vorlagen. | Ein eigener geprüfter Importfluss ohne operative Altzustände wäre nötig. |
| Gelten die vorgeschlagenen Betriebs-/Lastziele? | Gegen reale Event-/Aufgabenmengen und Betreiberressourcen validieren. | Referenzlast und Infrastruktur gemeinsam anpassen, ohne clientseitige Vollabfragen einzuführen. |

Diese Fragen verhindern die Nutzung des beschriebenen Zielbilds als Umsetzungsgrundlage nicht. Vor produktiver Datenmigration müssen insbesondere die Behandlung alter Fristen, der geänderte Event-Löschschutz und die Aufbewahrungsregel fachlich bestätigt werden.
