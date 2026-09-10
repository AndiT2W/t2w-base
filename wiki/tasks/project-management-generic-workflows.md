# Generische Abläufe, Abhängigkeiten und Status

**Diskussionshistorie; aktueller Vertrag: [Spezifikation v3](project-management-spec-v3.md).** Der Nutzer hat die Synthese in Issue #55 beauftragt. Die Vereinfachung auf direkte Aufgabenabhängigkeiten wurde dort übernommen; das weiter unten diskutierte separate Schrittmodell gehört nicht zum ersten Umfang.

Stand: 10.09.2026. **Status: Diskussionsvorschlag, nicht beschlossen.** Quelle: Nutzerfrage „wie könnte man es generischer machen mit abhängigkeiten und stati?“ vom 10.09.2026. Grundlage: [Readiness-Ergänzung](project-management-readiness-spec.md) und [Designvorschläge](project-management-readiness-designs.md).

## Aktuell diskutierte Vereinfachung: Aufgaben bilden den Ablauf

Quelle: anschließender Nutzervorschlag vom 10.09.2026: Abhängigkeiten direkt zwischen Aufgaben; sequenzielle Übersicht, bei Klick darunter die tabellarische Ansicht. **Vorschlag zur Konkretisierung, noch keine Implementierungsfreigabe:**

- Event → Kategorie → Aufgaben. Abhängigkeiten referenzieren vorhandene Aufgaben; keine separat gepflegten Ablaufschritte, Status oder Prozessnamen erforderlich. Dieser Ansatz ist eine Alternative zum unten beschriebenen zusätzlichen Schrittmodell und wird für die weitere Diskussion empfohlen.
- Zusammenhängende Aufgaben bilden automatisch einen Ablauf. Lineare Beziehungen werden als Kette dargestellt. Verzweigungen zeigen parallele Äste und ihre tatsächlichen Verbindungen; eine bloße topologische Sortierung darf keine zusätzliche Abhängigkeit suggerieren. Mehrere unabhängige Ketten erhalten getrennte Zeilen.
- Unabhängige Aufgaben bleiben als „Weitere Aufgaben“ mit eigenem Lagehinweis sichtbar; sie werden nicht künstlich zu einer Kette verbunden und fließen vollständig in die Kategoriebeurteilung ein. Ohne Abhängigkeiten gibt es nur die kompakte Kategorie-Zusammenfassung mit aufklappbarer Tabelle.
- Klick auf den Ablauf öffnet direkt darunter die Tabelle aller seiner Aufgaben; erneuter Klick schließt sie. Ein Schritt-Klick öffnet dieselbe Tabelle und markiert die zugehörige Zeile. Kategorien- und Ablaufumfang müssen eindeutig beschriftet bleiben. Tabellenzeilen enthalten Titel, Arbeitsstatus, Owner, Frist, Voraussetzung und nächsten Schritt/Ergebnis. Komplette Aufgabendetails können weiterhin ins Sheet führen.
- Kategorienübergreifende Vorgänger erscheinen als beschriftete Referenz in der betroffenen Kette. Jede Aufgabe bleibt genau ihrer eigenen Kategorie zugeordnet; Referenzen erzeugen keine doppelte Zählung.
- Prozessanzeige und Tabelle verwenden dieselben gespeicherten Aufgaben und dieselbe serverseitige Ableitung. NEW/IN_PROGRESS/DONE/CANCELLED bleiben Arbeitsstatus; „Voraussetzung offen“ ist Zusatzinformation, kein fünfter Status. Änderungen an Beziehungen berechnen die Darstellung neu; kein manuell gepflegter zweiter Prozessstand.
- Das Modell belegt die Lage der erfassten Arbeit. Es erkennt keine vergessenen Anforderungen: „Alles im Plan“ muss auf den erfassten Aufgabenumfang bezogen sein; ein leerer Bereich bedeutet „Keine Aufgaben erfasst“. Umfassende fachliche Readiness würde weiterhin einen ausdrücklich geprüften Sollumfang oder passende Fachnachweise benötigen. Damit bleibt die Frage nach expliziten Prüfpunkten eine Alternative, nicht stillschweigend entschieden.
- Eine Aufgabe „Versand beauftragen“ mit DONE ist kein Nachweis SENT oder DELIVERED. Die Übersicht verwendet ehrliche Aufgabentitel; fachliche Lieferzustände werden erst durch das spätere Liefermodell belegt.

Browser-Abnahme bei Umsetzung: Beziehung A→B speichern und nach Reload dieselbe Kette sehen; per Tastatur auf-/zuklappen; Schritt öffnet/markiert richtige Tabellenzeile; Statusänderung bleibt nach Reload in beiden Ansichten gleich; unabhängige Aufgaben bleiben sichtbar; Verzweigung erzeugt keine falsche Reihenfolge; fremde Kategoriebezüge werden nicht doppelt gezählt. Alle Start-/Storno-/Zyklus-/Konkurrenzregeln aus dem Abhängigkeitsvertrag bleiben erforderlich.

Interaktiver Gesprächsentwurf: `C:/Users/andi/.codex/visualizations/2026/09/10/01a08cd9-3d83-7b01-b4c8-bb61d71f6b9f/task-chain-overview.html`. Kein Produktcode und keine dauerhafte Mock-Persistenz.

## Zielbild und Umfang

**Zielbild:** Kategorien verwenden dieselben konfigurierbaren Ablaufbausteine. Admins definieren fachliche Schritte, deren Erfüllung und notwendige Vorgänger. Die Oberfläche zeigt daraus die aktuelle Lage, erfüllte Schritte und als Nächstes mögliche Arbeit. Event bleibt der operative Container.

**Offen:** Ob solche Abläufe überhaupt Teil eines nächsten Inkrements werden, ist nicht entschieden. Die aktuelle Readiness-Spezifikation definiert eine Prozesskette ausdrücklich nur als Anzeige ohne Startsperre. Dieser Vorschlag würde diese Grenze gezielt erweitern. Er ist keine Implementierungsfreigabe und ändert den bestätigten MVP nicht.

## Vorschlag: fachliche Schritte konfigurieren, Statussemantik vereinheitlichen

| Baustein | Bedeutung |
| --- | --- |
| Eventkategorie | Fachlicher Bereich und gemeinsame Readiness, beispielsweise Startnummern |
| Ablaufschritt | Erwartetes Ergebnis mit stabilem Schlüssel, fachlichem Namen, Reihenfolge und eindeutiger Erfüllungsquelle |
| Erfüllungsquelle | Genau eine maßgebliche Quelle: bestehende PM-Aufgabe, manuelle Bestätigung oder später eine lesende Regel auf Fachobjekten |
| Voraussetzung | Gerichtete Beziehung: Ergebnis von A muss vor dem operativen Beginn von B vorliegen |
| Aufgabenstatus | Weiterhin NEW, IN_PROGRESS, DONE, CANCELLED; nur Aufgaben besitzen diesen Arbeitslebenszyklus |
| Schrittanzeige | Abgeleitet: Nachweis fehlt, Voraussetzung offen, Bereit, In Arbeit, Erfüllt oder Nicht erforderlich |

Ein Ablaufschritt führt keinen zweiten Aufgabenstatus. Bei Aufgabenbindung steuert dieselbe EventTask Owner, Frist, nächsten Schritt und Arbeitsstatus; deren expliziter Abschlussvertrag liefert den Nachweis. Bei Fachquellen wird das Ergebnis gelesen. Eine zusätzliche Handlung, etwa Nachfragen beim Versandpartner, kann als unterstützende Aufgabe verknüpft werden; deren Abschluss ersetzt den Zustellnachweis nicht.

„Druckfreigabe“, „Gedruckt“, „Versandt“ und „Zugestellt“ sind fachliche Ergebnisse. Sie sind keine globalen Aufgabenstatus. Frei benannte Schritte reichen für viele Abläufe aus, ohne frei programmierbare Statusautomaten einzuführen. Sollten später eigene Statuslabels nötig sein, müssen sie fest auf die gemeinsame Semantik abgebildet sein; globale Filter und Abschlussregeln bleiben gleich.

## Voraussetzungen: ein einfacher, eindeutiger Vertrag

**Vorschlag:** Zunächst nur Ende-zu-Start innerhalb eines Events, auch über Kategorien hinweg. Alle Vorgänger müssen erfüllt sein (UND). Parallele Schritte entstehen durch fehlende Kanten zwischen ihnen; Zusammenführung durch mehrere Vorgänger. Keine Zyklen, Selbstkanten, ODER-Gruppen, automatischen Fristverschiebungen oder frei definierbaren Skripte.

Beispiel: Druckfreigabe → Gedruckt → Versandt → Zugestellt. Empfängeradresse bestätigen → Versandt. Gedruckt und Empfängeradresse sind beide notwendig; sie können parallel vorbereitet werden.

Aufgaben dürfen vor Erfüllung ihrer Voraussetzungen angelegt, zugewiesen und geplant werden. Erst Start/Abschluss ihrer gebundenen Ausführung unterliegen der Voraussetzung. Ein objektiv eingetretenes Fachereignis darf trotzdem erfasst werden: Eine belegte Zustellung ohne erfasste Druckfreigabe bleibt eine Zustellung und führt zum sichtbaren Klärungsbedarf beim fehlenden Vorgängernachweis. PM darf das Quellsystem nicht sperren oder Tatsachen zurücksetzen.

Storno erfüllt keine Voraussetzung. Nichtbedarf ist eine eigene begründete Entscheidung; bei vorhandenen Nachfolgern muss bewusst bestätigt werden, dass deren Voraussetzung entfallen darf. Das bloße Stornieren einer Aufgabe gibt Nachfolger nicht frei. Jede solche Änderung bleibt historisiert.

Bei Wiederöffnung oder Entzug eines Vorgängernachweises bleiben gestartete/erfüllte Nachfolger erhalten. Der Ablauf zeigt „Voraussetzung erneut prüfen“ und verlangt vor weiteren gebundenen Start-/Abschlussaktionen eine Klärung. Kein automatisches Zurücksetzen von Aufgaben oder Lieferdaten. Dies ist eine eigene vorgeschlagene Wiederöffnungsregel und ersetzt keine bestätigte Regel stillschweigend.

## Schrittanzeige und Kategorie-Readiness

Erfüllung und Ausführbarkeit werden getrennt abgeleitet. Ein bestätigter Nachweis zeigt Erfüllt, eine ungeklärte Quelle Nachweis fehlt. Bei unerfülltem Schritt und offenen Vorgängern erscheint Voraussetzung offen; bei erfüllten Vorgängern und NEW-Aufgabe Bereit; bei IN_PROGRESS In Arbeit. Ohne ausführende Aufgabe lautet die Aufforderung je Quelle „Bestätigen“ oder „Fachvorgang prüfen“. Bekannte Widersprüche werden zusätzlich genannt, auch an einem bereits erfüllten Schritt.

**Muss bei Übernahme:** Voraussetzung offen ist nicht automatisch Handlungsbedarf. Ein für nächste Woche geplanter Versand darf heute auf den planmäßig laufenden Druck warten. Sonst wären normale Abläufe fast immer gelb.

Handlungsbedarf entsteht durch überfällige notwendige Arbeit, fehlenden gültigen Plan/Owner, bekannte negative Fachzustände, entwertete Voraussetzungen bereits begonnener Arbeit oder erkennbare Terminwidersprüche. Ohne Dauer-/Aufwandsmodell kann nur ein offenkundiger Konflikt wie Vorgängerfrist nach Nachfolgerfrist festgestellt werden; gleiche Fristen beweisen keine realistische Gesamtplanung. Kein behaupteter kritischer Pfad.

Readiness bleibt der bisherigen Semantik verpflichtet: geprüft und erfüllt/gültig geplant = Alles im Plan; bekannte konkrete Abweichung = Handlungsbedarf; fehlender Umfang/Nachweis = Noch ungeprüft; begründeter Ausschluss = Nicht relevant. Aufgabenabschluss bleibt trotz Überfälligkeit erlaubt, sofern seine sonstigen Voraussetzungen erfüllt sind. Priorität NORMAL/HIGH steuert keine Abhängigkeit.

## Konfiguration und Darstellung

**Vorschlag:** Kleiner Admineditor als Schritteliste: Name, Erfüllungsquelle, notwendige Vorgänger, Reihenfolge. Ein grafischer Workflowdesigner ist zunächst unnötig. Mit späteren Serienvorlagen werden ausschließlich Definitionen versioniert übernommen; laufende Eventinstanzen und Vorjahre behalten ihren eigenen Stand. Keine Übernahme operativer Nachweise oder Historien.

Kategorieübersicht: aktueller fachlicher Stand, konkrete Begründung, nächster ausführbarer Schritt. Bei Parallelität mehrere aktuelle Schritte nennen statt einen falschen linearen Fortschritt zu behaupten. Details zeigen die Schritte in Reihenfolge mit Vorgängerhinweisen; ein Graph ist höchstens eine zusätzliche Detailansicht. Die bereits entworfene ruhige Bereichsübersicht A kann diese Regeln ohne neue Hauptnavigation darstellen.

## Erforderliche Regressionen bei späterer Umsetzung

Echte Browserabläufe gegen persistenten Service mit Reload: A abschließen gibt B frei; zwei Vorgänger verlangen beide Nachweise; unabhängige Schritte bleiben parallel ausführbar; Storno gibt Nachfolger nicht frei; bewusster Nichtbedarf bleibt nachvollziehbar; Wiederöffnung entwertet Voraussetzungen ohne Nachfolgerdaten zu löschen; objektive Lieferung bleibt trotz fehlendem Vorgängernachweis erhalten; planmäßige Voraussetzung erzeugt kein Gelb; zyklische und konkurrierende Kanten werden abgelehnt. PostgreSQL-Tests sichern Konkurrenz, Eventscope und atomare Fachmutation plus Aktivität plus Audit. Vorlagenregression prüft unveränderte Vorjahre und neue IDs ohne operative Altzustände.
