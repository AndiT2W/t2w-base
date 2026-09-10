## Problem Statement

Die heutige Eventaufgabe ist eine Checkbox mit Freitext-Verantwortlichem. Mitarbeitende erkennen weder den Arbeitsstand noch, welche Voraussetzung fehlt und welcher Schritt als Nächstes möglich ist. Eine dichte Aufgabenliste oder Dashboard-Kacheln geben keinen ruhigen Überblick über die operative Lage eines Events. Die globale Aufgabenansicht hängt zudem von bereits im Browser geladenen Events ab.

Benötigt wird eine integrierte Kategorieübersicht: Wie steht die erfasste Arbeit in Startnummern & Anmeldung, Hardware, Kommunikation oder Finanzen? Aufgaben mit Abhängigkeiten sollen als nachvollziehbarer Ablauf erscheinen. Ein Klick soll die zugrunde liegenden Aufgaben direkt darunter tabellarisch öffnen, ohne eine zweite Prozessstruktur zu pflegen.

## Solution

TIME2WIN erhält Projektmanagement im bestehenden Event-Workspace. Das Event bleibt der operative Projektcontainer. Administrierbare Gruppen strukturieren Aufgaben; direkte Abhängigkeiten zwischen Aufgaben erzeugen die Ablaufübersicht. Lineare Beziehungen erscheinen als Kette, parallele Beziehungen als Verzweigung. Ohne Abhängigkeiten zeigt die Kategorie eine kompakte Zusammenfassung. Klick auf Kategorie beziehungsweise Ablauf öffnet darunter die passend abgegrenzte Aufgabentabelle; Klick auf einen Schritt öffnet und markiert dessen Tabellenzeile.

Aufgabe und Abhängigkeitsbeziehung sind die maßgeblichen Daten. Es gibt keine zusätzlich gepflegten Prozessschritte, Checklisten, Prüfpunkte oder Prozessstatus. Arbeitsstatus bleiben NEW, IN_PROGRESS, DONE und CANCELLED; „Voraussetzung offen“, Überfälligkeit und Kategoriebeurteilung werden berechnet. „Alles im Plan“ bezieht sich ausdrücklich auf die erfassten Aufgaben und belegt keine unbekannten oder vergessenen Anforderungen.

Der erste Umfang umfasst Aufgabenbasis, Abhängigkeiten, Kategorie-/Ablaufübersicht mit aufklappbarer Tabelle, globale Ansichten, sichtbaren Verlauf und atomaren Audit. Liefermodell, Serienvorlagen, relative Fristen und lesender n8n-Servicezugriff folgen in getrennten Inkrementen. Es entsteht keine PM-Mail-/Reminder-Logik.

## User Stories

1. Als aktiver Mitarbeitender möchte ich eine Aufgabe in einem Event schnell mit Titel erfassen, damit Arbeit nicht verloren geht.
2. Als Mitarbeitender möchte ich einen internen Owner, eine Gruppe und einen nächsten Schritt setzen, damit Arbeit ausführbar ist.
3. Als Mitarbeitender möchte ich genau die Status Neu, In Arbeit, Erledigt und Storniert verwenden, damit Arbeitsstände über alle Events vergleichbar bleiben.
4. Als Mitarbeitender möchte ich Normal oder Hoch priorisieren, damit wichtige Arbeit sichtbar wird, ohne einen zusätzlichen Status einzuführen.
5. Als Mitarbeitender möchte ich eine optionale Tages- oder Zeitpunktfrist setzen, damit auch Aufgaben ohne feste Frist zulässig bleiben.
6. Als Mitarbeitender möchte ich Fristen in der Eventzeitzone beurteilt sehen, damit Browserzeitzonen die Überfälligkeit nicht verändern.
7. Als Mitarbeitender möchte ich überfällige Aufgaben mit Ergebnis abschließen können, damit Überfälligkeit keine künstliche Abschlusssperre ist.
8. Als Mitarbeitender möchte ich Fristverschiebungen, Stornos und Wiederöffnungen begründen, damit der Verlauf verständlich bleibt.
9. Als Mitarbeitender möchte ich notwendige Vorgänger einer Aufgabe auswählen, damit die Voraussetzung für deren Beginn eindeutig ist.
10. Als Mitarbeitender möchte ich eine Aufgabe mit mehreren Vorgängern erst nach Erledigung aller Vorgänger beginnen, damit keine Voraussetzung übergangen wird.
11. Als Mitarbeitender möchte ich unabhängige Arbeit parallel erledigen können, damit eine Anzeige keine künstliche Reihenfolge erzwingt.
12. Als Mitarbeitender möchte ich unerfüllte Voraussetzungen mit Aufgabentitel und Kategorie sehen, damit ich den nächsten sinnvollen Schritt finde.
13. Als Mitarbeitender möchte ich unnötige Abhängigkeiten mit Grund entfernen, damit der Plan korrigierbar bleibt.
14. Als Mitarbeitender möchte ich vor zyklischen oder eventfremden Verknüpfungen geschützt werden, damit ausführbare Abläufe entstehen.
15. Als Mitarbeitender möchte ich stornierte Vorgänger weiterhin als ungeklärte Voraussetzung erkennen, damit Storno nicht als Erfüllung gilt.
16. Als Mitarbeitender möchte ich Aufgaben begründet wiederöffnen können, ohne nachfolgende Ergebnisse zu löschen, damit Korrekturen die Historie erhalten.
17. Als Mitarbeitender möchte ich Kategorien zuerst als ruhige Zustandsübersicht sehen, damit Handlungsbedarf schnell erkennbar ist.
18. Als Mitarbeitender möchte ich Aufgabenketten automatisch aus Abhängigkeiten sehen, damit ich keinen zweiten Prozessstand pflegen muss.
19. Als Mitarbeitender möchte ich Verzweigungen und mehrere unabhängige Abläufe erkennen, damit parallele Arbeit nicht als lineare Kette missverstanden wird.
20. Als Mitarbeitender möchte ich unabhängige Einzelaufgaben weiterhin sehen, damit diese neben Prozessketten nicht untergehen.
21. Als Mitarbeitender möchte ich einen Ablauf aufklappen und seine Aufgaben direkt darunter als Tabelle bearbeiten, damit Übersicht und Detail am selben Ort bleiben.
22. Als Mitarbeitender möchte ich einen einzelnen Schritt anklicken und die zugehörige Tabellenzeile sehen, damit die Zuordnung eindeutig ist.
23. Als Mitarbeitender möchte ich Zustand, Owner, Frist, Voraussetzung und nächsten Schritt in der Tabelle sehen, damit ich ohne Kontextwechsel handeln kann.
24. Als Mitarbeitender möchte ich nach bestätigten Änderungen denselben Stand in Ablauf, Tabelle und globaler Ansicht sehen, damit es keine widersprüchlichen Daten gibt.
25. Als Mitarbeitender möchte ich planmäßig offene Voraussetzungen von echtem Handlungsbedarf unterscheiden, damit ein normal laufender Ablauf nicht ständig gelb erscheint.
26. Als Mitarbeitender möchte ich einen leeren Bereich als „Keine Aufgaben erfasst“ sehen, damit fehlende Planung nicht als Erfolg ausgegeben wird.
27. Als Mitarbeitender möchte ich unterhalb der Kategorien höchstens drei nächste Schritte sehen, damit die Übersicht ruhig bleibt.
28. Als Mitarbeitender möchte ich das Modul innerhalb des bestehenden Eventkopfs und der vorhandenen Tabs verwenden, damit die Navigation vertraut bleibt.
29. Als Mitarbeitender möchte ich Event-, Kategorie-, Ablauf- und Aufgabenansichten direkt verlinken und nach Reload wiederfinden, damit ich Arbeit gezielt aufrufen kann.
30. Als Mitarbeitender möchte ich global auch Aufgaben bislang ungeladener Events finden, damit die Übersicht vollständig ist.
31. Als Mitarbeitender möchte ich nach Event, Serie, Gruppe, Owner, Arbeitsstatus, Priorität, Frist, Voraussetzung und Archiv filtern, damit ich relevante Arbeit eingrenzen kann.
32. Als Mitarbeitender möchte ich erledigte und stornierte Arbeit samt Ergebnis und Verlauf weiterhin lesen, damit abgeschlossene Arbeit nachvollziehbar bleibt.
33. Als Admin möchte ich Gruppen anlegen, umbenennen, sortieren und deaktivieren, damit die Struktur zur Organisation passt und historische Zuordnungen erhalten bleiben.
34. Als Mitarbeitender möchte ich deaktivierte Owner und Gruppen bei offener Arbeit erkennen, damit ich die Zuweisung korrigieren kann.
35. Als Mitarbeitender möchte ich Versionskonflikte mit erhaltenen eigenen Eingaben sehen, damit niemand Änderungen still überschreibt.
36. Als Auditor möchte ich Fachmutation, sichtbare Aktivität und unveränderlichen Audit atomar geschrieben sehen, damit keine unprotokollierten Änderungen entstehen.
37. Als Admin möchte ich offene Arbeit vor Archivierung und PM-Historie vor physischer Löschung geschützt wissen, damit Aufgaben und Beziehungen erhalten bleiben.
38. Als Migrationverantwortlicher möchte ich alte Checkbox-Aufgaben vor Entfernung vollständig und kontrolliert sichern, damit die neue Aufgabenbasis ohne unsichere Übernahme startet.
39. Als mobiler oder tastaturbedienender Nutzer möchte ich Abläufe, Tabellen und Details ohne Drag-and-drop bedienen, damit alle Kernfunktionen erreichbar sind.
40. Als Mitarbeitender möchte ich vorhandene Kontakte, Nachrichten, Hardwarefälle, Auszahlungen und Dateien referenzieren, damit die Fachinformationen erreichbar bleiben, ohne kopiert zu werden.
41. Als Admin möchte ich in einem späteren Inkrement versionierte Serienvorlagen übernehmen, damit neue Events mit frischen Aufgaben und eventinternen Abhängigkeiten starten.
42. Als Admin möchte ich später relative Fristen erst nach Vorschau und Versionsprüfung verschieben, damit manuelle und abgeschlossene Termine unverändert bleiben.
43. Als Mitarbeitender möchte ich später Versand-/Lieferzustände getrennt von Aufgabenstatus führen, damit ein erledigter Versandauftrag nicht mit Zustellung verwechselt wird.
44. Als Automationsverantwortlicher möchte ich später einen eingeschränkten widerrufbaren Lesezugriff für n8n, damit Automationen ohne Benutzer-Session aktuelle PM-Daten lesen können.

## Implementation Decisions

### Umfang, Daten und Zuständigkeit

- **Muss:** Event ist der einzige operative Projektcontainer. Jede Aufgabe gehört genau zu einem Event. Es gibt keine Event-übergreifenden Aufgabenabhängigkeiten und kein Verschieben einer Aufgabe in ein anderes Event im ersten Umfang.
- **Muss:** Gruppe und Kategorie bezeichnen denselben administrierten Katalog. Initiale Vorschläge: Startnummern & Anmeldung, Hardware, Kommunikation, Finanzen. Regeln verwenden stabile IDs, keine fachliche Logik anhand veränderbarer Gruppennamen. Neue Verwendung nur aktiver Gruppen; verwendete Gruppen niemals physisch löschen.
- **Muss:** EventTask erhält internen Owner, Gruppe, vierwertigen Arbeitsstatus, zweiwertige Priorität, Fristtyp samt passenden Fristfeldern, nächsten Schritt, Abschlussergebnis und eigene optimistische Version. Titel genügt für NEW; Start und Abschluss verlangen aktiven Owner, gültige Gruppe und nächsten Schritt, Abschluss zusätzlich Ergebnis.
- **Muss:** Übergänge: NEW → IN_PROGRESS oder CANCELLED; IN_PROGRESS → DONE oder CANCELLED; DONE/CANCELLED → NEW oder IN_PROGRESS mit Wiederöffnungsgrund. Storno und Friständerung verlangen Grund. Deaktivierung ändert keinen gespeicherten Status; offene Aufgaben zeigen „Zuweisung prüfen“, die nächste inhaltliche Änderung beziehungsweise der Abschluss revalidiert die Zuweisung.
- **Muss:** Eventzeitzone als IANA-Kennung, Vorgabe Europe/Vienna. Tagesfrist wird ab 00:00 des Folgetags in dieser Zone überfällig; Zeitpunktfrist exakt ab gespeichertem UTC-Zeitpunkt. Ohne Frist nie überfällig. Überfälligkeit verhindert keinen Abschluss. HIGH beeinflusst Sortierung/Filter, nicht Abhängigkeiten oder Readiness.
- **Muss:** Neue Beziehung TaskDependency referenziert Vorgänger und Nachfolger desselben Events; gerichtete Kante eindeutig. Keine separat gespeicherten Ablaufschritte, Prozesszustände oder Checklisten. Sichtbare Abläufe sind Projektionen der Aufgabenbeziehungen.

### Abhängigkeiten und Konflikte

- **Muss:** Ein Beziehungstyp Ende-zu-Start: Vorgänger muss DONE sein, bevor Nachfolger nach IN_PROGRESS oder DONE wechseln darf. Alle Vorgänger sind UND-verknüpft. Vorher sind Erfassen, Zuweisen und Planen erlaubt. Kein automatisches Starten oder Abschließen durch Freigabe.
- **Muss:** Selbstbezüge, doppelte aktive Kanten, Zyklen und Event-übergreifende Kanten werden serverseitig abgelehnt, auch unter Konkurrenz. Kategorienübergreifende Abhängigkeiten innerhalb desselben Events sind zulässig.
- **Muss:** CANCELLED erfüllt eine Voraussetzung nicht. Mitarbeitende erledigen den wiedergeöffneten Vorgänger oder entfernen die Beziehung bewusst mit Pflichtgrund. Kein zusätzliches „übersprungen“ als Aufgabenstatus und kein implizites Freigeben beim Storno.
- **Muss:** Wiederöffnung eines erledigten Vorgängers bleibt mit Grund möglich. Gestartete oder erledigte Nachfolger werden nicht zurückgesetzt. Sie zeigen „Voraussetzung erneut prüfen“; vor weiteren Start-/Abschlussaktionen müssen die Voraussetzungen einschließlich einer inzwischen unvollständigen Vorgängerkette geklärt sein. Storno und korrigierende Plan-/Beziehungsänderungen bleiben möglich. Bereits dokumentierte Ergebnisse bleiben im Verlauf erhalten.
- **Muss:** Eine neue unerfüllte Voraussetzung an einem bereits gestarteten/erledigten Nachfolger wird abgelehnt. Eine bewusst wiedergeöffnete bestehende Voraussetzung bleibt dagegen als historisch nachvollziehbarer Klärungsfall bestehen. Dies verhindert unbemerkte nachträgliche Umdefinition ohne tatsächliche Arbeit zurückzusetzen.
- **Muss:** Abhängigkeiten werden über Auswahl vorhandener Aufgaben hinzugefügt und begründet entfernt. Kein Drag-Zwang, kein grafischer Workfloweditor. Ein Storno des Nachfolgers bleibt trotz unerfüllter Voraussetzungen möglich.
- **Muss:** Taskaktionen und Graphänderungen werden innerhalb eines Events transaktional koordiniert. Eigene Taskversion plus Event-Graphversion schützen Status- und Beziehungskommandos; Versionsprüfung, Zyklus-/Voraussetzungsprüfung, Mutation, Aktivität und Audit passieren atomar. Konkurrierendes Verknüpfen, Abschließen und Wiederöffnen darf keine Prüfung umgehen. Konflikte liefern 409 mit aktuellen Versionen; eigene Eingaben bleiben sichtbar, kein stilles Auto-Merge.
- **Vorschlag zur Darstellung:** Offenkundige Terminwidersprüche, etwa offene Vorgängerfrist nach offener Nachfolgerfrist, werden mit betroffener Kante angezeigt. Ohne Aufwands-/Dauermodell keine kritische-Pfad- oder Fertigstellungsprognose und keine automatische Terminverschiebung.

### Kategorieübersicht, Ablauf und Tabelle

- **Muss:** Bestehende dunkle TIME2WIN-Sidebar, heller Arbeitsbereich, Eventkopf mit Name/Code/Zeitraum/Status und horizontale Event-Tabs erhalten. Projektmanagement ersetzt den Aufgabenreiter neben den bestehenden Bereichen; übrige Tabs und mobiles Mehr-Menü bleiben. Keine neue Hauptnavigation und keine eigenständige App.
- **Muss:** Einstieg über ruhige Kategorieabschnitte in stabiler Katalogreihenfolge. Pro Kategorie textlicher Zustand und ein konkreter Erklärungssatz; keine KPI-Kacheln, pauschale Prozentbereitschaft oder komplette Aufgabenliste als Einstieg.
- **Muss:** Zusammenhängende Aufgaben mit Abhängigkeiten bilden automatisch Abläufe. Eine echte lineare Kette wird sequenziell dargestellt. Verzweigungen zeigen ausschließlich tatsächlich vorhandene Kanten und parallele Schritte. Eine topologische Sortierung allein darf keine zusätzliche Abhängigkeit suggerieren. Mehrere unabhängige Abläufe erhalten getrennte Zeilen. Keine künstlich gespeicherten Ablauf-IDs oder manuell gepflegten Prozessnamen nötig.
- **Muss:** Kategoriebezogene Darstellung enthält eigene Aufgaben; Vorgänger/Nachfolger aus anderen Kategorien werden als beschriftete Referenzen gezeigt. Referenzierte Aufgaben erscheinen in der Tabelle nur ihrer eigenen Kategorie und werden in Event-/Kategorieaggregaten nicht doppelt gezählt.
- **Muss:** Einzelaufgaben ohne Abhängigkeiten bleiben mit eigener Lagezusammenfassung unter „Weitere Aufgaben“ sichtbar und fließen in die Kategoriebeurteilung ein. Ohne Abhängigkeiten entfällt die Kette; Kategorieübersicht und aufklappbare Tabelle bleiben.
- **Muss:** Klick auf eine Ablaufzeile öffnet unmittelbar darunter alle Aufgaben dieses Ablaufs innerhalb der Kategorie; erneuter Klick schließt sie. Die Kategorieüberschrift öffnet die Tabelle der gesamten Kategorie. Die Beschriftung nennt jeweils den Umfang. Ein Schritt-Klick öffnet den passenden Ablauf und markiert dessen Tabellenzeile, erforderlichenfalls auf deren Ergebnisseite. Kein zusätzlicher Navigationswechsel nur zum Lesen der Tabelle.
- **Muss:** Tabelle enthält Titel, Arbeitsstatus, Owner, Priorität, Frist, unerfüllte Voraussetzungen und nächsten Schritt; bei terminalen Aufgaben Ergebnis/Stornogrund erreichbar. Umfangreiche Bearbeitung und Verlauf im vorhandenen Sheet-Muster. Nach Mutationen werden Ablauf, Tabelle und globale Ansicht aus derselben bestätigten Serverantwort beziehungsweise konsistent neu gelesenen Projektion aktualisiert; Stammdatenentwürfe werden nicht ersetzt.
- **Muss:** NEW/IN_PROGRESS/DONE/CANCELLED sind die einzigen Arbeitsstatus. „Voraussetzung offen“, „Bereit“ und „Voraussetzung erneut prüfen“ sind berechnete Zusatzanzeigen. Aufgabentitel bleiben Tätigkeiten: DONE bei „Versand beauftragen“ beweist keinen Lieferstatus SENT oder DELIVERED.
- **Muss:** Unterhalb der Kategorien höchstens drei nächste Schritte aus offenen Aufgaben. Ausführbare dringende Arbeit zuerst; bei blockiertem Nachfolger führt die Handlung zum frühesten zu klärenden Vorgänger. Jede Aufgabe höchstens einmal. Innerhalb gleicher Dringlichkeit HIGH, nächste Frist, stabile ID. „Alle Aufgaben“ bleibt erreichbar.
- **Muss:** Validierte URL-Parameter halten Eventtab, Kategorie, Ablauf über eine referenzierte Task-ID, Taskauswahl und Filter. Bei geänderten Graphen wird der aktuelle Ablauf der Task-ID aufgelöst; fehlende Zugehörigkeit erzeugt einen klaren Hinweis statt falscher Auswahl. Reload erhält die geöffnete Zielansicht und denselben gespeicherten Aufgaben-/Graphstand. Zurücknavigation erhält Filter; Fokus kehrt sinnvoll zum Auslöser zurück.
- **Muss:** Lange Ketten responsiv umbrechen; komplexe Verzweigungen als beschriftete parallele Bereiche oder Vorgängerreferenzen, ohne erfundene Kanten. Mobil bleibt die Kategorie bedienbar; eine breite Detailtabelle darf innerhalb ihres Bereichs scrollen. Bedienen bei 360 px, 200 % Zoom und nur per Tastatur; Zustände mit Text/Icon, nicht nur Farbe.

### Aufgabenbasierte Readiness

- **Muss:** „Alles im Plan“ bedeutet: Für die erfassten Aufgaben besteht kein bekannter Handlungsgrund. Sichtbarer Geltungshinweis „Bezieht sich auf erfasste Aufgaben“. Keine Behauptung, dass alle Anforderungen des Events überhaupt erfasst wurden. Ein leerer Bereich zeigt neutral „Keine Aufgaben erfasst“. Sind ausschließlich stornierte Aufgaben vorhanden, lautet die Zusammenfassung neutral „Alle erfassten Aufgaben storniert“, nicht erfolgreich erledigt. Ausschließlich DONE erlaubt „Alle erfassten Aufgaben erledigt“.
- **Muss:** Handlungsgründe sind überfällige offene Aufgaben, fehlender/inaktiver Owner oder Gruppe, fehlender nächster Schritt bei offener Arbeit, stornierter erforderlicher Vorgänger, offene Voraussetzung bereits begonnener/erledigter Arbeit und bekannte Terminwidersprüche. Gründe werden mit Task-/Kantenreferenz angezeigt. Deaktivierte Gruppen lassen bestehende Aufgaben und Verläufe sichtbar.
- **Muss:** Eine reguläre offene Voraussetzung allein erzeugt keinen Handlungsbedarf. Ein für nächste Woche geplanter Versand darf auf einen planmäßig laufenden Druck warten. Aufgaben ohne Frist bleiben zulässig; fehlende Frist allein erzeugt weder Verzug noch Handlungsbedarf. Der Erklärungssatz darf dann keine zeitlich belegte Fertigstellung behaupten.
- **Muss:** Offene Zusatzaufgaben und sämtliche Seiten einer Kategorie zählen zur Bewertung. Tabellenfilter, Pagination, Ownerfilter oder die drei nächsten Schritte dürfen keine unbeschrifteten Kategorien grün rechnen. Ein bekannter Handlungsgrund hat Vorrang vor planmäßigen Teilaufgaben.
- **Muss:** Kategorie- und globale Zustände werden serverseitig mit einem gemeinsamen Referenzzeitpunkt und strukturierten Gründen abgeleitet; keine sprachmodellgenerierten Fachbehauptungen. Ladefehler/fehlende Daten zeigen „Bewertung nicht verfügbar“ oder ausdrücklich veralteten Stand, niemals aktuelles Grün. Nach eigenen Mutationen neu berechnen; bei aktiver Ansicht spätestens nach 30 Sekunden und Fokuswechsel aktualisieren. Zeitablauf erzeugt keine künstlichen Aktivitätseinträge.
- **Muss:** Kein manueller Grün-Schalter und keine separate Kategorie-Checkliste im ersten Umfang. Fachliche Hardware-Rückgabequoten, Antwortpflichten oder Auszahlungsvorbereitung werden ohne entsprechende Quelle nicht aus Aufgabenanzahl/Mailrichtung abgeleitet. Fachliche Vollständigkeitsprüfungen wären eine gesonderte Erweiterung.

### Globale Ansicht und Integration

- **Muss:** Vorhandene globale Aufgabenroute und Menüeintrag verwenden und bei Auslieferung aktivieren. Ruhige Eventübersicht mit betroffenen Kategorien und Hauptgrund; daneben explizit wählbare Aufgabenansicht. Standard: nicht archivierte Events mit Handlungsbedarf; „Alle Events“ zeigt planmäßige und leere Bereiche. Vergangene und abgesagte Events mit Restarbeit werden nicht still ausgeblendet.
- **Muss:** Serverseitige Suche, Cursorpagination und vollständige Aggregate; keine Summierung ausschließlich geladener Events/Tabellenzeilen. Filter für Event, Serie, Kategorie, Owner inklusive unzugeordnet/inaktiv, Arbeitsstatus, Priorität, Frist/Überfälligkeit/ohne Frist, Voraussetzung offen, Archiv und Text. Mehrfachwerte innerhalb einer Dimension ODER, Dimensionen untereinander UND. Eventzeitraum und Aufgabenfrist getrennt. Bei unverändertem Datenstand keine fehlenden/doppelten Cursorzeilen.
- **Muss:** Gemeinsamer PM-Workspace-/API-Vertrag für Event und globale Ansicht; Lesen von Aufgaben, Kategorien, vollständiger Ablaufstruktur, Gründen und Aktivitäten sowie Commands für Aufgabenaktionen und Abhängigkeitsänderungen. Graphstruktur unabhängig von Tabellenpagination abfragen; keine Kanten aus nur einer Seite rekonstruieren. Keine zweite Statusberechnung in den Routen. Bestehende Event-, Tabellen-, Auth- und Audit-Schnittstellen wiederverwenden.
- **Muss:** Alle Rechte serverseitig: aktive MITARBEITER für operative Aufgaben-/Abhängigkeitsaktionen; ADMIN zusätzlich für Gruppen/Systemverwaltung und Reaktivierung archivierter Events. Inaktive Konten kein Zugriff. Eventkontaktrollen sind keine Loginrechte.
- **Muss:** TaskActivity bleibt sichtbarer append-only Änderungsverlauf, getrennt vom technischen AuditLog. Erstellung, Owner, Gruppe, Priorität, Frist, Status, Abhängigkeit hinzugefügt/entfernt, Wiederöffnung und spätere Liefer-/Vorlagenaktionen enthalten Autor/Zeit und vorher/nachher beziehungsweise Grund. Kantenänderung schreibt nachvollziehbaren Vorgänger-/Nachfolgerbezug; keine freitextliche Kommentarplattform.
- **Muss:** Referenzen verbinden bestehende Kontakte, Nachrichten, Hardwarefälle, Auszahlungen und Dateien mit Existenz-, Eventscope- und Sichtbarkeitsprüfung. Aufgabenmutationen ändern deren Fachstatus nicht. Fachsysteme dürfen tatsächliche Ereignisse unabhängig vom PM-Graph erfassen.

### Migration, Historie und spätere Inkremente

- **Muss:** Vor Entfernung der Legacy-Checkboxaufgaben zugriffsgeschützten vollständigen JSON/CSV-Snapshot mit Run-ID, Anzahl, Hash, Speicherort und ausführendem Benutzer erstellen, prüfen und auditieren. Erst danach kontrolliert entfernen. Keine Übernahme alter IDs, Fristen, Checkboxstände oder Freitext-Owner in das neue PM-Modell. Snapshotzugriff und Wiederherstellung in Staging prüfen; keine destruktive Rückmigration nach PM-Schreibvorgängen.
- **Muss:** Historien-/Löschschutz sowie Aktivität und Audit gehören bereits vor die ersten produktiven PM-Schreibvorgänge. Offene Aufgaben verhindern Eventarchivierung; auch ein ungeklärter Abhängigkeitskonflikt bei terminalen Aufgaben darf nicht durch Archivierung verborgen werden. Archiv ist lesbar und schreibgeschützt; physische Eventlöschung mit PM-Historie wird bis zu einer gesonderten Aufbewahrungsentscheidung abgelehnt. Task- und Abhängigkeitsgeschichte darf nicht durch bestehende Cascade-Löschpfade verschwinden.
- **Später:** Separates Liefermodell mit eigener Semantik und Abschlussprüfung. Versand ist keine Zustellung, Rücksendung keine Zustellbestätigung; Teillieferungen bleiben erkennbar. Diese Zustände sind keine Taskstatus und ändern weder Hardware- noch Zahlungsstatus.
- **Später:** Benannte Eventserie mit stabilen bestehenden Serien-IDs; revisionierte Aufgaben- und Abhängigkeitsvorlagen. Übernahme atomar und idempotent, neue Task-IDs und eventinterne Kanten, NEW, keine operativen Altzustände. Abgewählte/inaktive notwendige Vorgänger in Vorschau ausdrücklich klären. Bestehende Instanzen behalten ihre Revision; erneute Anwendung erzeugt keine Duplikate.
- **Später:** Relative Fristen zu Eventbeginn/-ende mit Kalendertag-Offset; Vorschau und explizite versionsgeprüfte Bestätigung vor Verschiebung offener relativer Termine. Manuelle/terminale Termine unverändert. Keine stillen Änderungen durch Serienwechsel oder Vorlagenrevision.
- **Muss:** Vorjahresevents, Aufgabenhistorien, Kommentare, Audit-, Versand- und Lieferdaten dürfen niemals aus Serienvorlagen kopiert oder verändert werden. Dies gilt ebenso für manuelle Ausnahmen und Aktivitätsverläufe.
- **Später:** Widerrufbarer, auditierbarer Service-Token für ausschließlich lesenden PM-Zugriff durch n8n auf denselben paginierten Datenvertrag. Kein PM-Schreibscope, keine Benutzer-Session und keine PM-Mail-/Reminder-/Claim-/Eskalationslogik.

## Testing Decisions

**Gemeinsame Testgrenze:** Eventansicht und globale Ansicht verwenden denselben PM-Workspace-/API-Vertrag. Echte Browser-E2E fahren vollständige Benutzerabläufe gegen NestJS und persistentes PostgreSQL; nach Mutationen Reload und erneute Prüfung von Ablauf, Tabelle und globalem Zustand. API-Fixtures dürfen vorbereiten, aber Mock-only Stores oder abgefangene Requests ersetzen keinen Persistenznachweis. Diese Grenze entspricht der bereits vorgegebenen Browser-/Reload-Regel.

Bestehende Eventdetail-, Eventverwaltung-, Hardware-, Auszahlungs- und Auditlog-Suites dienen als Vorbild für Selektoren, Navigation, Fehlerfeedback und Bedienabläufe. Deren teilweise verwendete API-Mocks werden nicht als Beleg echter Datenbankpersistenz übernommen.

| Abnahme | Vollständiger Ablauf und erwartetes Ergebnis |
| --- | --- |
| E2E-01 Aufgabenbasis | Aufgabe erfassen, Owner/Gruppe/Priorität/Frist/nächsten Schritt speichern, neu laden; dieselben Werte und gleiche ID im richtigen Event. Start, Abschluss mit Ergebnis und begründete Wiederöffnung bleiben erhalten. |
| E2E-02 Kette | A→B speichern, Reload; zwei Schritte mit genau dieser Kante. Klick öffnet die Tabelle darunter, erneuter Klick schließt. Schritt-Klick öffnet und markiert die richtige Zeile; Deep-Link/Reload stellt diese Ansicht wieder her. |
| E2E-03 Freigabe | Start/Abschluss von B vor DONE(A) wird mit konkreter Voraussetzung abgelehnt. A erledigen, B starten, Reload: A erledigt und B in Arbeit in Tabelle und Ablauf. |
| E2E-04 Verzweigung | A→C und B→C; A und B parallel bearbeiten. C erst nach beiden freigegeben. Darstellung behauptet keine Kante A→B. |
| E2E-05 Unabhängige Arbeit | Zwei getrennte Ketten und Einzelaufgabe in derselben Kategorie; alle bleiben sichtbar. Ohne Kanten nur Kategorie-Zusammenfassung plus Tabelle; keine erfundene Reihenfolge. |
| E2E-06 Storno/Korrektur | A stornieren: B bleibt unerfüllt. Kante mit Grund entfernen, Reload: B bereit und Entfernungsgrund im Verlauf. Storno zählt nicht als erledigt. |
| E2E-07 Wiederöffnung | A erledigen, B beginnen/erledigen, A wiederöffnen: B behält Daten/Status, Hinweis „Voraussetzung erneut prüfen“; weitere abhängige Start-/Abschlussaktion abgelehnt, bis die Vorgängerkette geklärt ist. |
| E2E-08 Unzulässige Kanten | Selbstbezug, Zyklus und fremdes Event versuchen; abgelehnt, nach Reload keine ungültige Kante. Neue unerfüllte Kante an gestarteter Aufgabe ebenfalls abgelehnt. |
| E2E-09 Kategoriebezug | Vorgänger aus anderer Kategorie verknüpfen; Kontextreferenz korrekt, Navigation führt zur Quelle, keine doppelte Aufgabe in Kategorie-/Eventzahlen. |
| E2E-10 Readiness | Planmäßige offene Voraussetzung bleibt im Plan; ab Fristgrenze Handlungsbedarf. HIGH allein und fehlende Frist allein erzeugen keinen Verzug. Fehlender Owner/nächster Schritt wird konkret genannt. |
| E2E-11 Leere/terminale Bereiche | Null Aufgaben bleibt neutral; nur stornierte Aufgaben nicht als erledigt. Ausschließlich erledigte Aufgaben korrekt beschriftet; kein behaupteter Liefer- oder Finanzzustand. |
| E2E-12 Zeit/Abschluss | Tages-/Zeitpunktgrenzen inklusive DST und verschiedener Browserzonen prüfen. Überfällige ansonsten zulässige Aufgabe abschließen: Erfolg, Ergebnis nach Reload, kein aktuelles Überfälligkeitsflag. |
| E2E-13 Zuweisung | Owner/Gruppe deaktivieren; bestehende Zuordnung/Status und Historie bleiben, Prüfhinweis erscheint. Neue ungültige Zuweisung beziehungsweise Abschluss wird serverseitig abgelehnt. |
| E2E-14 Globale Vollständigkeit | Mehr Events als frühere Ladegrenze und mehrere Taskseiten: ungeladenes Event auffindbar, Aggregate vollständig. Filter/URL/Zurück/Reload konsistent, Ablauf umfasst auch Aufgaben außerhalb der Tabellen-Ergebnisseite. |
| E2E-15 Gleichzeitigkeit | Zwei Browser ändern dieselbe Task-/Graphversion: ein Erfolg, zweiter klarer Konflikt mit erhaltener Eingabe; Reload zeigt nur gültigen Serverstand. |
| E2E-16 Atomarer Fehler | Testweise Audit- oder Aktivitätsschreiben fehlschlagen lassen; UI zeigt Fehler statt Erfolg, nach Reload keine Teilmutation und kein scheinbar erfolgreicher Verlauf. |
| E2E-17 Rechte/Historie | Mitarbeiter versucht Gruppenverwaltung und inaktiver Benutzer Mutation; serverseitig abgelehnt. Eventarchivierung mit offener Arbeit und Eventlöschung mit PM-Historie abgelehnt; Archivänderung nur nach zulässiger Reaktivierung. |
| E2E-18 Bedienung | 360 px, 200 % Zoom und Tastatur: Kategorie/Ablauf öffnen, Schritt wählen, Tabelle/Sheet bedienen, Abschlussdialog, Zurück. Eventkopf/Tabs vorhanden, kein Drag-Zwang; maximal drei nächste Schritte. |
| E2E-19 Fehler/Entwurf | Datenabruf scheitert: kein aktuelles Grün; Wiederherstellung korrekt. PM-Mutation überschreibt keinen parallel ungespeicherten Stammdatenentwurf. |
| Später Liefermodell | Versandauftrag abschließen bestätigt keine Zustellung; mehrere Sendungen/Teillieferungen und separate Lieferabschlussregeln nach Reload korrekt. |
| Später Vorlagen | Zweifache und parallele Übernahme idempotent; neue Aufgaben/Kanten, unverändertes Vorjahr und keine kopierten Historien. Terminverschiebung nur nach bestätigter Vorschau. |
| Später n8n | Lesender Token erlaubt paginierte Abfragen, verweigert Mutationen und verliert nach Widerruf Zugriff. |

Domain-Tests sichern Status-/Zeit-/Readinessregeln und tatsächliche Graphkanten, nicht Layoutimplementierung. PostgreSQL-Integrationstests sichern transaktionale Konkurrenz von Status- und Graphänderungen, Zyklusfreiheit, Eventscope, Audit/Aktivität, Löschschutz sowie Snapshotvollständigkeit und kontrollierten Cutover. Jede zusätzliche Funktion erhält im selben Change eine passende echte Browser-Regression; relevante Browserprüfungen laufen vor einem Implementierungscommit.

## Out of Scope

- Eigenständige Projekt-App, zusätzliches Project-Aggregate, neue Hauptnavigation und ClickUp-Synchronisation.
- Separates Prüfpunkt-/Checklisten-/Prozessschrittmodell, manuell gepflegter Prozessstatus oder pauschaler Grün-Schalter im ersten Umfang.
- Beliebige konfigurierbare Statusautomaten, grafischer Workfloweditor, ODER-Abhängigkeiten, Event-übergreifende Kanten, kritischer Pfad, Ressourcenplanung und automatische Terminverschiebung.
- Red Flags, Risiken, manuelle Blocker, WAITING-/BLOCKED-Arbeitsstatus, Kommentare, Kanban und Kalender im ersten Umfang. Berechnete Voraussetzungen sind keine zusätzlichen Arbeitsstatus.
- Dashboard-Kacheln, komplette Aufgabenliste als Einstieg und erfundene fachliche Prozentbereitschaft.
- Automatische Änderung von Event-, Kontakt-, Kommunikations-, Hardware- oder Finanzdaten durch PM-Aufgaben.
- Liefermodell, Vorlagen, relative Fristen und n8n-Token im ersten Inkrement; deren oben beschriebene Verträge gelten für spätere Auslieferung.
- PM-E-Mail, Reminder, Push, Versandautomation und automatische Antworterkennung.
- Migration alter Checkbox-Aufgaben in neue Aufgaben; Kopieren oder Verändern operativer Vorjahresdaten aus Serienvorlagen.

## Further Notes

**Spezifikation v3, Stand 10.09.2026.** Synthese des aktuellen Nutzerauftrags zur Anpassung von Issue #55. Diese Fassung ist für den spezifizierten Umfang maßgeblich und ersetzt widersprechende MVP-/UX-Regeln der v2 sowie das vorgeschlagene separate Prüfmodell. Erstmals enthalten sind direkte Aufgabenabhängigkeiten und die daraus berechnete Übersicht mit aufklappbarer Tabelle. Die alten Fassungen bleiben als Historie erhalten.

**Lieferreihenfolge:** (1) verifizierter Legacy-Snapshot und Historien-/Rechteschutz; (2) Aufgabenbasis, Abhängigkeiten, Kategorie-/Ablaufübersicht, globale Ansichten, Aktivität/Audit und echte Browser-E2E; (3) getrennte Inkremente für Lieferung, Serienvorlagen/relative Fristen und lesenden n8n-Zugriff. Keine Produktimplementierung durch die Erstellung dieser Spezifikation.

**Belegter Ausgangspunkt:** Vorhandene Eventaufgaben besitzen nur Checkbox-/Freitextfelder; Eventdetail bietet Aufgabenreiter, Kopf und Tabs; globale Aufgaben werden lokal aus geladenen Events projiziert; der vorhandene Hauptmenüeintrag ist noch deaktiviert. NestJS/Prisma, interne Rollen und transaktionaler Audit-Zugang sind vorhanden. Die bestehenden fachlichen Entscheidungen zu Event als Container, Benutzerrechten und Historienerhalt bleiben maßgeblich.

**Quellen im Repository:** [bisherige Spezifikation v2](project-management-spec-v2.md), [Readiness-Diskussion](project-management-readiness-spec.md), [Aufgabenketten-Diskussion](project-management-generic-workflows.md), [Systembenutzer und Berechtigungen](../decisions/2026-09-09-systembenutzer-und-berechtigungen.md), [Prisma-Schema](../../services/event-service/prisma/schema.prisma), [Eventdetail](../../src/routes/events.$eventcode.tsx), [globale Aufgaben](../../src/routes/aufgaben.tsx), [Sidebar](../../src/components/t2w/AppSidebar.tsx), [Browser-Testhinweise](../../tests/e2e/README.md). GitHub-Issue: [#55](https://github.com/AndiT2W/t2w-base/issues/55).
