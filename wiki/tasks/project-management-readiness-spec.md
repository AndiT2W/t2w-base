---
title: Projektmanagement – Ergänzung Kategorie-Readiness
type: specification
status: superseded
updated: 2026-09-10
sources:
  - ../sources/2026-09-10-user-event-readiness.md
  - project-management-spec-v2.md
---

# Projektmanagement: Kategorie-Readiness

**Historischer Entwurf.** Der Nutzerauftrag zur Anpassung von Issue #55 wurde in [v3](project-management-spec-v3.md) synthetisiert: Aufgabenabhängigkeiten erzeugen die Übersicht, Klick öffnet die Tabelle. Das hier vorgeschlagene separate Prüfmodell gehört nicht zum aktuellen ersten Umfang. Die Aussagegrenze bleibt: Aufgabenlage belegt keine unbekannten Anforderungen.

Visuelle Ausarbeitung: [drei Designvorschläge](project-management-readiness-designs.md) vom 10.09.2026; noch keine Variante ausgewählt.

Spätere Diskussion: [generische Abläufe mit Voraussetzungen](project-management-generic-workflows.md). Noch nicht beschlossen; die hier beschriebene reine Prozessanzeige erhält dadurch keine Abhängigkeitssperren.

## 1. Geltung und Entscheidungsvorschlag

**Zielbild:** Der Reiter Projektmanagement beantwortet zuerst „Welche Eventkategorie ist im Plan, wo muss ich handeln?“. Aufgaben sind die ausführbare Arbeit hinter dieser Beurteilung. Readiness bedeutet hier **nachvollziehbare aktuelle Planlage**, nicht „Event vollständig fertig“ oder eine Durchführungsgarantie.

**Muss:** Der bestätigte MVP aus der [Nutzerquelle](../sources/2026-09-10-user-event-readiness.md) bleibt die Grenze: Event als Projektcontainer; vier Aufgabenstatus, zwei Prioritäten, optionale Frist, interner Owner, Gruppe, nächster Schritt, Abschlussergebnis, atomare Aktivität und Audit. Keine zusätzlichen Aufgabenstatus, Blocker, Risiken, Kommentare, Abhängigkeiten oder Reminder. Lieferstatus, Serienvorlagen und relative Fristen bleiben spätere Inkremente. n8n erhält später ausschließlich lesenden Zugriff.

**Vorschlag:** Hybridmodell aus wenigen fachlichen Prüfpunkten und zugeordneten Aufgaben. Ein Prüfpunkt beschreibt eine erwartete Tatsache, eine Aufgabe die Arbeit zu ihrer Herstellung. Existiert bereits eine verlässliche fachliche Quelle, wird deren Zustand gelesen; er wird nicht zusätzlich als Checkbox gepflegt.

**Offen – einzige Umfangsentscheidung:** Gehören explizite Prüfpunkte bereits zum ersten Readiness-Inkrement? Empfehlung: ja, zunächst manuell beziehungsweise mit explizitem Aufgabenbezug, ohne Liefermodell oder automatische Mailauswertung. Bis zur Entscheidung sind diese Ergänzungen vorgeschlagene Abnahmeregeln, keine bestätigte Erweiterung des MVP. Bei Ablehnung heißt die erste Sicht „Aufgabenlage“ und darf keine umfassende fachliche Readiness behaupten.

**Leseschlüssel:** Zielbild beschreibt den Nutzen. Muss bezeichnet bestätigte Grenzen sowie Abnahmebedingungen bei Übernahme dieses Vorschlags. Vorschlag bezeichnet die hier empfohlenen neuen Produktregeln. Offen bezeichnet eine noch ausstehende Nutzerentscheidung. Es wurde kein Produktcode implementiert.

## 2. Befunde und Konflikte mit bisherigen Entwürfen

Die [Spezifikation v2](project-management-spec-v2.md) ist Grundlage, [v1](project-management-spec.md) nur Historie. [Issue #55](https://github.com/AndiT2W/t2w-base/issues/55) wurde am 10.09.2026 einschließlich leerer Kommentarliste gelesen.

| Evidenz | Befund / Konsequenz |
| --- | --- |
| [Prisma-Schema](../../services/event-service/prisma/schema.prisma) | Keine Kategorieprüfung oder fachliche Readiness vorhanden. EventTask ist eine Checkbox. Nachrichten haben Richtung und Conversation-ID, aber keine definierte Antwortpflicht. Payout trennt Mail- und Zahlungsstatus, besitzt keinen Freigabestatus „vorbereitet“. |
| [Eventdetail](../../src/routes/events.$eventcode.tsx) | Eventkopf, horizontale Tabs und mobiles Mehr-Menü existieren. Der Aufgabenreiter wird ersetzt; TIME2WIN und Dateien bleiben erhalten. Tabwahl ist derzeit lokaler Zustand und braucht künftig URL-Unterstützung. |
| [Globale Aufgabenroute](../../src/routes/aufgaben.tsx) | Aktuell clientseitige Projektion geladener Events; offene Aufgaben zeigen sogar Eventstatus. Künftig serverseitige Aufgaben- und Readiness-Ableitung mit getrennten Statusbegriffen. |
| [Sidebar](../../src/components/t2w/AppSidebar.tsx) | Dunkle bestehende Sidebar; `/aufgaben` ist vorhanden, aber `available: false`. Bei Auslieferung vorhandenen Eintrag aktivieren, keinen neuen Hauptmenüpunkt schaffen. |
| Visuelle Referenz, siehe [Quelle](../sources/2026-09-10-user-event-readiness.md) | Kategorien und kurze nächste Schritte sind sinnvoll. Prozentbalken und pauschale Prozessketten suggerieren unbelegte Vollständigkeit. |

**Kritik der Referenz:** „Auszahlungen vorbereitet“ verträgt sich nicht mit einem abgehakten Schritt „Auszahlung“ und 100 %. „2 Antworten ausständig“ verträgt sich nicht mit vollständig abgehakten Rückmeldungen. „Versand in Bearbeitung“ allein begründet keinen Handlungsbedarf. Eine Hardware-Rückgabequote belegt weder Bereitstellung noch Einsatz. Der blaue Punkt bei „Versandt“ lässt offen, ob Versand bereits geschehen ist. Diese Unklarheiten werden durch eindeutige Texte und getrennte Nachweise beseitigt.

**Muss – Vorrang des aktuellen Nutzerauftrags:** Dashboard-Kacheln, Fortschrittsprozente und die komplette Aufgabenliste als Einstieg aus v2 Abschnitt 5 sind für dieses Zielbild überholt. Readiness ergänzt keine verdeckten Warte-/Blockermodelle. Die v2-Phasen verschieben teils Löschschutz und Aktivität nach hinten, obwohl beide vor produktiven PM-Schreibvorgängen nötig sind. Verweise auf Fristmigration betreffen keine Übernahme von Legacy-Aufgaben: bestätigter Weg ist Snapshot, Prüfung, Entfernung. Das v2-Zielmodell listet außerdem spätere Liefer-/Vorlagenfelder; diese gehören nicht automatisch in die erste Migration. Issue #55 enthält relative Fristen in allgemeinen Entscheidungen; der aktuelle Auftrag verschiebt sie ausdrücklich nach hinten. Diese Konflikte sind hier dokumentiert, das Issue wurde nicht verändert.

## 3. Modellvergleich und Begriffe

| Modell | Stärke | Entscheidende Schwäche | Bewertung |
| --- | --- | --- | --- |
| Nur Aufgaben aggregieren | Wenig Pflege; Frist und Zuständigkeit vorhanden | Vergessene Aufgaben unsichtbar; DONE beweist keine Lieferung; leere Kategorie könnte falsch grün werden | Geeignet für Aufgabenlage, nicht für fachliche Vollständigkeit |
| Nur explizite Checkliste | Erwartete Ergebnisse und fehlende Nachweise sichtbar | Arbeit, Owner und nächster Schritt fehlen; drohende doppelte Pflege neben Fachmodulen | Allein nicht ausreichend |
| Prüfpunkte + Aufgaben + gezielte Quellen | Sollumfang, Beleg und Handlung bleiben unterscheidbar | Kleines zusätzliches Prüfmodell und klare Quellenregeln nötig | **Vorschlag: übernehmen** |

**Vorschlag – Begriffe:**

- **Aufgabengruppe / Kategorie:** derselbe administrierte Katalogeintrag, keine zweite parallele Taxonomie. „Kategorie“ ist die Bezeichnung der Readiness-Sicht. Keine Ableitungslogik anhand veränderbarer Anzeigenamen.
- **Eventkategorie:** Verwendung einer Kategorie in genau einem Event, einschließlich Relevanz und geprüftem Sollumfang. Kein eigenes Projekt-Aggregate.
- **Prüfpunkt:** präzise erwartete Tatsache, etwa „Druckfreigabe für Fassung 3 liegt vor“. Gehört zu genau einer Eventkategorie.
- **Nachweis:** nachvollziehbare Grundlage für einen Prüfpunkt: manuelle Bestätigung, ausdrücklich gebundener Aufgabenabschluss oder später eine fachliche Quellregel.
- **Prozesskette:** geordnete Anzeige zusammengehöriger Prüfpunkte. Keine Aufgabenabhängigkeit und keine Startsperre.
- **Readiness:** berechnete Beurteilung zum angegebenen Zeitpunkt auf Basis des geprüften Umfangs, der Nachweise und der offenen Arbeit.

**Vorschlag – minimaler fachlicher Datenbedarf, keine Prisma-Festlegung:**

| Objekt | Erforderliche Information |
| --- | --- |
| Eventkategorie | Event-ID, Kategorie-ID, Relevanz `UNREVIEWED / REQUIRED / NOT_REQUIRED`, Begründung für Nichtrelevanz, geprüfte Umfangsrevision mit Prüfer/Zeit, aktuelle Version |
| Prüfpunkt | ID, Eventkategorie, eindeutige Aussage, Reihenfolge; optional expliziter absoluter Bedarfstermin; genau eine Nachweisart; optional Bezug auf eine ausführende Aufgabe desselben Events und derselben Kategorie |
| Manuelle Feststellung | `UNKNOWN / UNMET / CONFIRMED / NOT_REQUIRED`, Beleg-/Ergebnistext, Autor/Zeit, Revision; bei Nichtbedarf oder Rücknahme Pflichtgrund |
| Aufgabenbasierter Nachweis | Explizite Task-ID und bei Zuordnung festgelegtes Abnahmekriterium; DONE mit Ergebnis erfüllt dieses Kriterium, sonst nicht. Allgemeine TaskReference allein zählt nicht als Nachweis. |
| Spätere fachliche Quellregel | Stabiler Regeltyp und Version, Eventscope, Zielzustand und Quellen-IDs beziehungsweise deklarierte Quellmenge; Auswertung enthält Quelle und Datenstand |
| Readiness-Projektion | Zustand, strukturierte Gründe und Quellbezüge, kurzer Erklärungssatz, nächste Schritte, `asOf`, Umfangs-/Regelrevision; kein unabhängig editierbarer Status |

Eine Aufgabe erfüllt im ersten Inkrement höchstens einen Prüfpunkt; mehrere Arbeitsschritte werden in dessen Ergebnisaufgabe gebündelt oder als separate Aufgaben ohne Nachweisbindung geführt. Dadurch entsteht kein Abhängigkeitsgraph. Ein Prüfpunkt besitzt entweder eine manuelle Bestätigung oder einen gebundenen Aufgabenabschluss als maßgebliche Quelle. Eine zweite Erledigt-Checkbox für denselben Nachweis entfällt. Ein manuell bestätigter Prüfpunkt kann eine noch offene Nachweisaufgabe sichtbar lassen: Arbeitsstatus wird niemals automatisch geändert.

Bei aufgabenbasiertem Nachweis gilt NEW/IN_PROGRESS/CANCELLED als unerfüllt, DONE mit gültigem Ergebnis als bestätigt. Fehlende, unzulässige oder nicht lesbare Quellbindung gilt als unbekannt. Eine fachlich geänderte Aufgabenbeschreibung entwertet die vereinbarte Nachweisbindung bis zur erneuten Prüfung; bloßes Umbenennen einer Anzeige darf keine neue fachliche Tatsache behaupten.

## 4. Geltungsumfang und leere Kategorien

**Vorschlag:** Die vier Kategorien Startnummern & Anmeldung, Hardware, Kommunikation und Finanzen bilden die initiale Prüfauswahl. Neue Events beginnen dort mit „Noch ungeprüft“. Mitarbeitende legen je Event fest, was relevant ist, erfassen wenige konkrete Prüfpunkte und bestätigen den Sollumfang. Dies bestätigt die Vollständigkeit der Planung, nicht die Erfüllung der Prüfpunkte. Weitere Admin-Kategorien können bewusst ergänzt werden; keine automatische Serienübernahme.

**Muss:** Null Aufgaben oder null Datensätze bedeutet niemals automatisch „Alles im Plan“. Eine relevante Kategorie braucht mindestens einen Prüfpunkt. Wer eine Kategorie als nicht relevant erklärt, nennt den Grund. Bestehen offene Aufgaben oder bekannte einschlägige Fachvorgänge, wird dieser Schritt abgelehnt; diese sind zuerst fachlich zu klären. Eine unbekannte Datenlage kann nicht durch „nicht relevant“ beseitigt werden.

**Vorschlag:** Aufnahme/Entfernung/inhaltliche Änderung von Prüfpunkten, neue oder umgruppierte Aufgaben und eine geänderte relevante Quellmenge machen die Umfangsprüfung ungültig. Änderungen von Status, Frist oder Owner berechnen die Lage neu, verlangen aber keine erneute Umfangsbestätigung. Änderung einer Prüfpunkt-Aussage oder ihrer Nachweisquelle entwertet deren bisherige Bestätigung. Terminverschiebung des Events verlangt erneute Umfangsprüfung; absolute Fristen bleiben bestehen.

Admins verwalten Namen und Reihenfolge. Deaktivierung verhindert neue Verwendung und erhält vorhandene Eventkategorien, Prüfpunkte und Historie. Offene Aufgaben mit deaktivierter Gruppe zeigen weiterhin „Zuweisung prüfen“ gemäß v2. Eine Katalogänderung fügt bestehenden Events keine neuen Pflichten still hinzu. Archivierte Events bleiben lesbar und schreibgeschützt; ihre letzte Bewertung wird mit Zeitpunkt dargestellt. Eventabsage erledigt oder entwertet keine Restarbeit automatisch.

## 5. Exakte Ableitungsregeln

### 5.1 Zustände und Priorität

**Vorschlag:** Zwei operative Zustände plus zwei ausdrücklich neutrale Zustände. „Noch ungeprüft“ darf nicht grün eingefärbt oder global aus Handlungslisten ausgeblendet werden.

| Rang | Bedingung | Anzeige |
| --- | --- | --- |
| 1 | Mindestens ein bekannter Handlungsgrund nach 5.2 | **Handlungsbedarf**; bei zusätzlichen Wissenslücken außerdem „Bewertung unvollständig“ |
| 2 | Kein bekannter Handlungsgrund, aber Relevanz/Umfang/Nachweis unbekannt oder benötigte Quelle nicht aktuell auswertbar | **Noch ungeprüft** mit konkretem Prüfauftrag |
| 3 | Gültig begründete Nichtrelevanz und keine widersprechende offene Arbeit | **Nicht relevant**; aus fachlichen Erfüllungszahlen ausgeschlossen |
| 4 | Relevanz und Umfang geprüft, jeder relevante Prüfpunkt erfüllt oder gültig geplant, keine Handlungsgründe oder Wissenslücken | **Alles im Plan** |

„Alles im Plan“ ist daher auch bei künftiger offener Arbeit möglich. Erklärung dann beispielsweise „Druck bestätigt; Zustellung für 09.01. geplant“, niemals „Zugestellt“. Sind alle relevanten Prüfpunkte erfüllt, darf der Satz „Alle vereinbarten Nachweise liegen vor“ lauten. Kein zusätzlicher Aufgabenstatus „bereit“.

### 5.2 Bekannte Handlungsgründe

**Vorschlag – Vereinigungsmenge, ohne Doppelzählung derselben Ursache:**

1. Offene Aufgabe (`NEW` oder `IN_PROGRESS`) ist überfällig nach v2. HIGH allein erzeugt keinen Handlungsbedarf; es sortiert nur.
2. Offene Aufgabe besitzt keinen aktiven internen Owner, keine gültige Gruppe oder keinen konkreten nächsten Schritt. Schnellerfassung bleibt erlaubt; die Anzeige lautet „Planung ergänzen“, nicht „Start fehlgeschlagen“.
3. Ein als unerfüllt bekannter relevanter Prüfpunkt ist nicht gültig geplant: keine offene zugeordnete Aufgabe, kein Bedarfstermin, Bedarfstermin bereits erreicht oder Taskfrist liegt nach der Bedarfsgrenze. Fehlende Daten für die Planung erzeugen einen benannten Klärungsbedarf, keine erfundene Frist.
4. Die operative Aufgabe zu einem unerfüllten Prüfpunkt wurde abgeschlossen oder storniert, ohne dessen Nachweis zu erbringen. Die Arbeit gilt nicht automatisch als fachlich erfolgreich.
5. Ein späterer Quelladapter liefert einen belegten negativen Zustand, etwa fehlgeschlagene Lieferung. Er muss die konkrete Quelle nennen. Widersprechende manuelle und fachliche Daten verlangen Klärung.

**Gültig geplant** ist ein bekannter, noch unerfüllter Prüfpunkt genau dann, wenn ein expliziter Bedarfstermin in der Zukunft liegt und eine zugeordnete offene Aufgabe mit aktivem Owner, aktiver Gruppe, nächstem Schritt und einer noch nicht erreichten Frist spätestens zu diesem Bedarfstermin besteht. Bereits erfüllte/nicht erforderliche Prüfpunkte brauchen keinen Termin. Eine unbekannte Feststellung wird durch einen Plan nicht zu einem bestätigten Nachweis.

**Muss:** Aufgaben ohne Frist sind zulässig und nie überfällig. Eine solche Aufgabe kann trotzdem „Planung ergänzen“ auslösen, wenn sie den einzigen Plan für einen unerfüllten Prüfpunkt darstellt. Normale zusätzliche Aufgaben mit Owner und nächstem Schritt dürfen ohne Frist bestehen. Kategorie-Readiness sperrt weder Aufgabenbeginn noch Abschluss; es gelten ausschließlich die bestätigten Aufgabenregeln. Überfällige Arbeit kann mit Ergebnis abgeschlossen werden.

Stornierte Zusatzaufgaben erzeugen allein keinen dauernden Handlungsbedarf und zählen nicht als erledigt. Eine Stornierung erfüllt niemals einen gebundenen Prüfpunkt; dessen Bedarf wird bewusst neu geplant oder mit Grund aufgehoben. Wiederöffnung eines nachweisgebenden Tasks entzieht dessen aktuelle Erfüllung; der vorherige Abschluss bleibt im Verlauf.

### 5.3 Erklärung und Zeit

**Muss:** Server liefert dieselbe Ableitung für Event und globale Sicht. Erklärungssätze entstehen deterministisch aus Gründen und Belegen, nicht aus frei generierten Behauptungen. Hauptgrund: überfälliger Bedarfstermin, überfällige Aufgabe, fehlender Plan/Zuweisung, dann Wissenslücke; innerhalb gleicher Klasse früheste Grenze, danach stabile ID. „+2 weitere Punkte“ öffnet die vollständige Begründung.

Die Fristsemantik folgt v2: Zeitpunkt exakt, Tagesfrist bis 00:00 des Folgetags in Eventzone; keine pauschalen 24 Stunden über DST. „Heute fällig“ ist vor der Grenze noch nicht überfällig. Readiness trägt `asOf`; eigene Mutationen aktualisieren beide Sichten nach Serverbestätigung. **Vorschlag:** Bei aktiver Ansicht spätestens alle 30 Sekunden und bei Fokuswechsel neu lesen. Reiner Zeitablauf erzeugt keine künstlichen Audit-/Aktivitätseinträge. Laden oder Ladefehler erscheint als eigener technischer Anzeigezustand; ein letzter bekannter grüner Wert darf nur ausdrücklich als veraltet gezeigt werden.

## 6. Manuelle Bewertung und Übersteuerung

**Vorschlag:** Kein direkt editierbares „Alles im Plan“ und kein beliebiger gelb/grün-Schalter. Mitarbeitende können Tatsachen bestätigen, eine falsche Bestätigung begründet zurücknehmen, Nichtbedarf begründen oder Planung ändern. Der Gesamtzustand wird danach neu berechnet. So bleibt eine konkrete fehlende Information sichtbar und es entsteht kein verstecktes Risiko-/Blockerfeld.

Manuelle Bestätigungen verlangen Belegtext, Autor und Zeitpunkt; ein vorhandener Link kann ergänzen. Nichtbedarf hebt eine Anforderung ausdrücklich auf und wird als „nicht erforderlich“ dargestellt, nie als erledigt gezählt. Eine künftig quellengebundene Feststellung kann nicht grün überschrieben werden: Fehler an der Quelle korrigieren oder eine neue, begründete fachliche Feststellung dokumentieren, wobei der Quellenwiderspruch sichtbar bleibt, bis er geklärt ist.

**Muss:** Operative Prüfungen für aktive MITARBEITER/ADMIN gemäß [Benutzerentscheidung](../decisions/2026-09-09-systembenutzer-und-berechtigungen.md), Katalogverwaltung nur ADMIN. Versionsprüfung, Eventscope und Archivschutz im Service. Jede Prüf-/Umfangs-/Nichtbedarfsänderung schreibt die Fachänderung, eine sichtbare append-only Aktivität und den separaten AuditLog atomar. Kategorieaktivitäten gehören in einen eventbezogenen PM-Verlauf mit Kategorie-/Prüfpunktbezug; dafür keine Dummy-Aufgabe anlegen. Historische Einträge werden durch Korrektureinträge ergänzt. Kein freier Kommentarstrom.

## 7. Prozessketten und Fachmodule

### 7.1 Startnummern & Anmeldung

**Zielbild:** `Druckfreigabe → Gedruckt → Versandt → Zugestellt` zeigt vier gesonderte Tatsachen. Der nächste fachliche Schritt ist der erste nicht bestätigte, relevante Schritt. Kennzeichnung mit Text und Icon: „bestätigt“, „noch offen“, „nicht erforderlich“ oder „Nachweis fehlt“. Ein Zusatz „in Bearbeitung“ ist nur aus der verknüpften IN_PROGRESS-Aufgabe zulässig; „Versandt“ selbst bleibt bis zum Beleg offen.

**Muss:** Bestätigung eines späteren Schritts bestätigt frühere Schritte nicht automatisch. Bei Zustellung ohne Drucknachweis bleibt „Drucknachweis fehlt“ sichtbar; die tatsächliche Zustellung wird nicht verworfen. Die Reihenfolge sperrt keine Aufgaben und ist kein Abhängigkeitsgraph. Teilweise Bestätigungen werden nicht auf den ganzen Prozess hochgerechnet. Anmeldung benötigt eigene passende Prüfpunkte; eine fertige Druckkette belegt keine eingerichtete Anmeldung.

**Vorschlag zum Schnitt:** Im ersten Readiness-Inkrement nur ausdrücklich erfasste Prüfpunkte wie Druckfreigabe und Drucknachweis sowie normale Aufgaben für Versandarbeit. Keine Versand-/Zustellkette vortäuschen, solange das Lieferinkrement fehlt. Erst mit separatem Liefermodell werden Versandt/Zugestellt aus dessen vollständigem Event-/Sendungsscope abgeleitet. Keine Zwischenlösung als verstecktes Task-Lieferstatusfeld.

Später: SENT belegt Versand, DELIVERED die Zustellung aller erforderlichen Sendungen; Teillieferungen bleiben offen. RETURNED ist kein Zustellnachweis, auch wenn dieser Lieferzustand nach v2 einen Aufgabenabschluss erlauben kann. CANCELLED erfüllt ein Lieferziel nicht. Nicht erforderlicher Versand ist ein begründeter Nichtbedarf, beispielsweise Übergabe vor Ort; diese Übergabe braucht einen eigenen Nachweis. Eine weitere erforderliche Sendung hebt eine bisher vollständige Lieferbewertung wieder auf. Kein Carrier-Automatismus vorausgesetzt.

### 7.2 Verhältnisse zu vorhandenen Modulen

| Kategorie | Belastbare Aussage / Quelle | Grenze und erster Umfang |
| --- | --- | --- |
| Hardware | Später „6 von 6 Rückgabevorgängen dokumentiert“ aus explizit definiertem Eventscope und Rückgabenachweisen | HardwareIssue enthält Menge, aber keine dokumentierte Teilrückgabemenge. Vorgänge und Stückzahlen nicht vermischen. COMPLETED allein ist kein physischer Rückgabenachweis. Im ersten Umfang manuelle Feststellung mit Verweis auf Hardware; automatische Regel erst mit geprüfter Semantik für RETURNED/returnedAt, Korrekturen und vollständige Quellmenge. |
| Kommunikation | „2 Antworten ausständig“ nur aus zwei ausdrücklich erfassten, unerfüllten Antwort-Prüfpunkten; zugehörige Aufgaben führen die nächste Arbeit | Keine Ableitung aus ausgehenden Mails oder vermeintlicher Threadvollständigkeit. Kein WAITING-Status und keine Antwortepisode. Mail-Eingang erfüllt keinen Prüfpunkt automatisch. Bei künftig geplantem Nachfassen kann trotz ausständiger Antworten „Alles im Plan · 2 Antworten ausständig; Nachfassen bis 05.01. geplant“ gelten. Handlungsbedarf erst nach Abschnitt 5. |
| Finanzen | „Auszahlungen vorbereitet“ nur als explizite Bestätigung eines definierten Umfangs, z. B. Empfänger und Beträge der aufgelisteten Auszahlungen geprüft | Payout.mailStatus = GESENDET belegt nur Mailversand; paymentStatus = AUSBEZAHLT belegt Zahlung. Keine Ableitung „vorbereitet“ aus ENTWURF oder vorhandener IBAN. Vorbereitung und tatsächliche Zahlung bleiben getrennte Prüfpunkte. Eine neue/geänderte Auszahlung entwertet eine darauf bezogene manuelle Sammelbestätigung. |

**Muss:** Keine PM-Aktion ändert Hardware-, Kommunikations-, Finanz- oder Eventstatus. Zugeordnete Fachobjekte bleiben an ihrem ursprünglichen Ort bearbeitbar. Fachliche Nachweise dürfen trotz erledigter PM-Aufgabe unvollständig sein und umgekehrt. Ohne ausreichende Quelle bleibt ein konkreter Satz als ungeprüft gekennzeichnet. Eine grüne Rückgabeprüfung allein färbt nicht die gesamte Hardwarekategorie grün, wenn andere vereinbarte Anforderungen offen und ungeplant sind.

## 8. Informationsarchitektur

### Eventdetail

**Muss:** Bestehende dunkle Sidebar, heller Arbeitsbereich, Eventkopf mit Name/Code/Zeitraum/Eventstatus und horizontale Event-Tabs. Projektmanagement ersetzt Aufgaben am vorhandenen Platz; weitere Tabs bleiben erhalten. Mobile Mehr-Navigation wiederverwenden. Kein neuer App-Rahmen.

**Vorschlag – Reihenfolge innerhalb des Tabs:**

1. Kurze Überschrift „Eventbereitschaft“ mit Datenstand; Aktion „Aufgabe anlegen“ zurückhaltend daneben.
2. Eine ruhige vertikale Liste von Kategorieabschnitten in Admin-Reihenfolge. Je Abschnitt Name, textlicher Zustand, ein konkreter Erklärungssatz und „Details“. Keine KPI-Kacheln oder Prozentbalken. Relevante Prozesskette optional unter dem Satz; keine Pflichtkette für Hardware, Kommunikation oder Finanzen.
3. Höchstens drei „Nächste Schritte“: Handlung, Kategorie, Owner, Frist falls vorhanden, konkreter Handlungsgrund. Zuerst ungeplanten/fälligen Bedarf und Prüfaufträge, danach planmäßige Arbeit; innerhalb gleicher Dringlichkeit HIGH, nächste Frist, stabile ID. Gleiche Aufgabe nur einmal. Ein Prüfauftrag ohne Task ist als „Prüfung“ benannt und öffnet den Prüfpunkt. Keine Checkbox zum stillen Abschließen.
4. Link „Alle Aufgaben“ als sekundäre Arbeitsansicht; abgeschlossene und stornierte Aufgaben sowie Verlauf erst dort beziehungsweise im Detail.

Kategorie öffnen: derselbe Eventrahmen, fokussierte Kategorieansicht mit allen Gründen, Prüfpunkten und ihren Quellen; darunter nur ihre Aufgaben. Taskdetail im bestehenden Sheet-Muster mit Ergebnisdialog und Aktivitäten. Zurück führt zur Kategorieübersicht und erhält Position. Beispiel für geplante URL: `?tab=projektmanagement&category=<id>&task=<id>`. IDs werden serverseitig zum Event geprüft. Alte Aufgaben-Deep-Links werden auf den neuen Tab aufgelöst.

„Nicht zugeordnet“ ist eine sichtbare Klärungszeile für Taskentwürfe ohne Gruppe, keine zusätzliche frei gepflegte Kategorie. Aktive Filter in der Aufgabenliste verändern die Readiness nicht. Der Umfang einer Bewertung ist stets die gesamte Eventkategorie, nie nur die drei nächsten Schritte.

### Globale Übersicht

**Vorschlag:** Bestehende Route `/aufgaben`, bestehender Menüeintrag „Aufgaben“. Zwei einfache Ansichten „Eventübersicht“ (Standard) und „Aufgaben“. Eventübersicht als ruhige Liste, eine Zeile je Event: Name/Code/Zeitraum, betroffene Kategorien und Hauptgrund, nächster Schritt. Kategorien mit Handlungsbedarf zuerst nennen; ungeprüfte Kategorien sichtbar daneben. Keine starre breite Matrix für beliebig viele Admin-Kategorien.

Standard: nicht archivierte Events mit Handlungsbedarf oder ungeprüften Kategorien, einschließlich vergangener/abgesagter Events mit Restarbeit. „Alle Events“ zeigt auch planmäßige Fälle. Filter für Event/Serie/Zeitraum/Kategorie/Bewertung; Owner und Taskstatus in der Aufgabenansicht. Ein Ownerfilter darf nie die Gesamtbewertung einer Kategorie grün rechnen. Eventstatus und Aufgabenstatus sind getrennt beschriftet.

Serverseitige Filter, Cursorpagination und Aggregate über den vollständigen sichtbaren Scope; keine Abhängigkeit von zuvor geladenen Events. Filter und Ansicht in URL. Klick auf Kategorie öffnet exakt deren Eventdetail; Zurück und Reload erhalten Filter. Ein Event zählt in „Events mit Handlungsbedarf“ nur einmal, auch bei mehreren betroffenen Kategorien. Ungeprüfte Events separat zählen, nicht mit planmäßigen vermischen; keine pauschale Prozent-Readiness für Events.

**Muss – Zugänglichkeit:** Zustand über Text und Icon, sichtbare Tastaturfokussierung, eindeutiger Linkname pro Kategorie, mobile Zeilen umbrechen bei 360 px. Keine reine Farb-/Hoverinformation. Nach Sheet-Schließen Fokus auf Auslöser; asynchrone Änderungen als eine verständliche Statusmeldung. Hier gelten bestehende UI-Konventionen; die lokale UX-Suche lieferte für Disclosure keinen spezifischen Treffer, daher allgemeine Skill-Regeln für Navigation und Zugänglichkeit statt eines neuen Designsystems.

## 9. Akzeptanz und echte Browser-Regressionen

**Muss:** Jedes eingeführte Feature erhält im selben Change einen echten Browser-Test gegen NestJS und persistentes PostgreSQL. Fachmutationen über die UI ausführen, danach hart neu laden und Event- sowie globale Anzeige überprüfen. Fixtures dürfen per API vorbereitet werden; reine Mock-Stores belegen keine Persistenz. Tests müssen vor einem späteren Commit laufen. Diese Dokumentänderung führt keine Produktfunktion ein; die folgenden Tests sind spezifiziert, noch nicht ausgeführt.

| ID / Inkrement | Browserablauf | Beobachtbare Abnahme nach Reload |
| --- | --- | --- |
| R-01 / Readiness | Neues Event ohne Aufgaben öffnen | Vier initiale Kategorien ungeprüft, keine grüne 0/0-Aussage; global unter ungeprüft auffindbar |
| R-02 / Readiness | Relevante Kategorie, konkreten Prüfpunkt und Umfang bestätigen; Nachweis zunächst unbekannt lassen | Kategorie bleibt ungeprüft; gezielter Prüfauftrag statt „keine Aufgaben = fertig“ |
| R-03 / Readiness | Unerfüllten Prüfpunkt mit Bedarf 09.01. und vollständig geplanter Aufgabe bis 08.01. erfassen; Referenzzeit 02.01. | Alles im Plan mit noch offenem Nachweis und Plantermin; DONE wird nicht suggeriert |
| R-04 / Readiness | Gleichen Plan ohne Owner beziehungsweise nächsten Schritt speichern | Erfassung möglich, Kategorie Handlungsbedarf „Planung ergänzen“; Daten erhalten |
| R-05 / Readiness | Taskfrist entfernen | Task nie überfällig; wenn einziger Plan für unerfüllten Prüfpunkt, konkreter Planungsbedarf sichtbar; eigenständige terminlose Zusatzaufgabe bleibt zulässig |
| R-06 / Readiness | Testuhr über Tages-/Zeitpunktgrenze führen, in zwei Browserzeitzonen und über DST; HIGH ergänzen | Gleiche serverseitige Bewertung, HIGH allein ändert sie nicht; überfällige Aufgabe mit Ergebnis abschließbar |
| R-07 / Readiness | Explizit nachweisgebende Aufgabe starten, abschließen, dann begründet wiederöffnen | Bestätigung entsteht nur aus vereinbarter Bindung; Wiederöffnung entzieht sie; frühere Ergebnisse/Aktivitäten erhalten |
| R-08 / Readiness | Aufgabe zu einem noch unerfüllten manuellen Prüfpunkt stornieren oder erledigen | Prüfpunkt bleibt unerfüllt und verlangt neue Planung; Storno gilt nicht als Erfolg |
| R-09 / Readiness | Manuell bestätigen, dann Prüfpunkt-Aussage ändern oder Bestätigung zurücknehmen | Neuer Prüfbedarf, ursprüngliche Bestätigung und Grund im append-only Verlauf; kein direkter Grün-Schalter |
| R-10 / Readiness | Nichtrelevanz ohne Grund/bei offener Arbeit versuchen; danach zulässigen Nichtbedarf erklären | Ungültige Fälle abgewiesen; zulässiger Fall neutral und historisiert, nicht als erledigt gezählt |
| R-11 / Readiness | Zwei Schritte explizit erfassen; späteren zuerst bestätigen | Früherer Schritt bleibt offen/ungeprüft; aktuelle Position textlich eindeutig; kein automatischer Task-Start-/Abschlussblock |
| R-12 / Readiness | Zweiten relevanten Prüfpunkt oder neue Kategorieaufgabe aufnehmen; Gruppe umbenennen/deaktivieren | Umfang muss erneut geprüft werden; Umbenennung erhält IDs, Deaktivierung erhält Historie und zeigt bei offener Arbeit Zuweisungsbedarf |
| R-13 / Readiness | Kategorie und Aufgabe über URL öffnen, bearbeiten, zurück; parallel Stammdatenentwurf halten | Richtiger Eventscope, Filter/Position erhalten, nach Reload persistente PM-Werte; Stammdatenentwurf durch PM-Antwort nicht überschrieben |
| R-14 / Readiness | Mehr Events als bisherige Ladegrenze und mehrere Ergebnisseiten; global filtern | Ungeladenes Event auffindbar; Summen vollständig, keine doppelten Events; Listenfilter ändern keine Kategorie-Readiness |
| R-15 / Readiness | Datenabruf scheitern lassen; anschließend wiederherstellen | Kein aktuelles Grün bei Ladefehler; veralteter Stand erkennbar, Wiederherstellung lädt korrekte Bewertung |
| R-16 / Readiness | Zwei Browser ändern dieselbe Prüfung; zweite Sitzung speichert alte Version | 409-Konflikt mit erhaltener Eingabe; kein Überschreiben und kein doppelter Aktivitätseintrag |
| R-17 / Readiness | Mitarbeiter versucht Katalogverwaltung/fremden Eventscope; inaktives Konto versucht Mutation | Server lehnt ab; nach Reload unveränderte Daten. Archiv sperrt Prüfung und Aufgabenänderung |
| R-18 / Readiness | Kategorie, Details, Abschlussdialog und Zurück nur per Tastatur bei 360 px und 200 % Zoom bedienen | Lesbare Zustände, Fokusführung, höchstens drei nächste Schritte, erreichbare vollständige Aufgabenliste; keine neue Hauptnavigation |
| R-19 / Lieferinkrement | Zwei erforderliche Sendungen: eine SENT, eine DELIVERED; später beide zugestellt; weitere Sendung ergänzen | Keine vollständige Zustellung vor vollständiger Beleglage; danach bestätigt; zusätzliche Sendung hebt Vollständigkeit auf; RETURNED/CANCELLED nie als zugestellt |
| R-20 / Fachadapter | Sechs Hardwarevorgänge, davon einer COMPLETED ohne Rückgabenachweis; später dokumentierte Rückgabe | Kein falsches 6/6; korrekte Einheit „Vorgänge“; neue Ausgabe verändert Umfang und Bewertung |
| R-21 / Readiness | Zwei Antwort-Prüfpunkte erfassen, Nachricht empfangen, einen manuell bestätigen | Antwortzahl bleibt zunächst zwei, dann eins; keine Mailautomatik oder neuer Aufgabenstatus; zukünftiger gültiger Plan kann Alles im Plan ergeben |
| R-22 / Fachadapter | Auszahlungsvorbereitung bestätigen; Mail senden; Auszahlung ändern/ergänzen; später Zahlung erfassen | Mail bedeutet keine Zahlung; Änderung entwertet zugehörige Sammelbestätigung; Vorbereitung und Zahlung getrennt |
| R-23 / Vorlageninkrement | Neues Jahres-Event mit Vorlage anlegen und zweimal übernehmen | Neue ungeprüfte Eventkategorien, keine kopierten Bestätigungen, Historien, Kommentare, Audit-, Versand-/Lieferdaten; Vorjahr unverändert; keine Duplikate |
| R-24 / Basis | Archivierung mit offener Aufgabe und Löschen bei PM-Prüf-/Aktivitätshistorie versuchen | Ablehnung und vollständig erhaltene Historie nach Reload; auch Kategoriehistorie ohne Tasks ist geschützt |

Zusätzliche Domain-/PostgreSQL-Tests sichern Wahrheitstabelle, Zeitgrenzen, Scope- und Mengenwechsel, Versionskonkurrenz sowie Fehler beim Schreiben von Audit oder Aktivität ab. Ein injizierter Audit-/Aktivitätsfehler rollt die gesamte Mutation zurück; zugehöriger Browserfehlerpfad zeigt keinen Erfolg und nach Reload den alten Stand. Snapshotvollständigkeit und kontrollierte Legacy-Entfernung bleiben eigene Integrations-/Cutover-Tests der Basis. Readiness-Testdaten stammen niemals aus unkontrolliert migrierten Legacy-Checkboxen.

## 10. Empfohlener Umsetzungsschnitt nach Produktentscheidung

**Vorschlag:** Aufgabenbasis einschließlich Historien-/Löschschutz und Aktivität bereitstellen; darauf die Readiness-Sicht mit Eventkategorien, kleinem Prüfmodell, nachvollziehbaren Gründen und globaler Eventübersicht. Kein generischer Regel- oder Checklisten-Designer. Die Umfangsentscheidung aus Abschnitt 1 bleibt vor Implementierung zu treffen.

Liefermodell und vollständige Versandkette folgen separat. Automatische Hardware-/Finanzadapter folgen erst nach festgelegten Quellregeln und ihren R-20/R-22-Regressionen. Serienvorlagen erhalten später ausschließlich Definitionen; neue Events beginnen ohne operative Nachweise, manuelle Ausnahmen oder abgeschlossene Zustände. Vorjahresevents und ihre Historien werden niemals kopiert oder geändert. Eine spätere Implementierungsplanung muss Issue #55 ausdrücklich mit dieser Ergänzung abgleichen.
