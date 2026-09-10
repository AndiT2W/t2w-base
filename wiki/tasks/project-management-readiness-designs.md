# Kategorie-Readiness: drei Designvorschläge

Aktueller Interaktionsvertrag gemäß [v3](project-management-spec-v3.md): Aus Aufgabenabhängigkeiten abgeleitete Ablaufübersicht mit darunter aufklappbarer Tabelle. Die drei früheren Entwürfe bleiben als Gestaltungshistorie erhalten; kein zusätzliches Prüfpunktmodell im ersten Umfang.

Stand: 10.09.2026. **Status: Vorschläge, keine Auswahl bestätigt.** Quelle: Folgeauftrag der Nutzerkonversation „bitte 3 designvorschläge erarbeiten“. Grundlage: [Readiness-Spezifikation](project-management-readiness-spec.md).

Die drei interaktiven Entwürfe verwenden denselben beispielhaften Event und Datenstand, denselben bestehenden App-Rahmen und dieselbe Readiness-Semantik. Keine Produktimplementierung; die Frage nach Prüfpunkten im ersten Umfang bleibt offen. Die Beispiele sind keine operativen Eventdaten.

| Vorschlag | Informationsarchitektur | Vorteil | Abwägung |
| --- | --- | --- | --- |
| A – Ruhige Bereichsübersicht | Alle Kategorien in stabiler Reihenfolge untereinander; Zustand und konkreter Satz; Details klappen auf. Drei nächste Schritte darunter. | Leicht erlernbar und schnell vollständig zu überblicken. | Bei vielen Kategorien wächst die Seitenlänge. |
| B – Handlungsorientiertes Briefing | Zuerst Kategorien mit Handlungsbedarf, danach planmäßige beziehungsweise ungeprüfte Kategorien. Gründe direkt sichtbar. | Tagesgeschäft: nötige Entscheidungen stehen zuerst. | Kategorien wechseln beim Zustandswechsel die Position; weniger räumliche Stabilität. |
| C – Kategorien mit Arbeitsbereich | Zusammenfassungen links, ausgewählte Kategorie und Nachweise rechts; zunächst kurze Lageübersicht. | Häufiger Wechsel zwischen Kategorien ohne Verlust des Überblicks. | Benötigt mehr Breite; auf kleinen Bildschirmen werden die Bereiche untereinander angeordnet. |

**Empfehlung:** A als Ausgangspunkt. B eignet sich für ein tägliches Briefing, C für längere Bearbeitungssitzungen. Keine Variante verwendet KPI-Kacheln, pauschale Prozentbereitschaft oder eine komplette Aufgabenliste als Einstieg.

Alle Entwürfe zeigen die spätere Lieferkette auf Wunsch; über Designoptionen kann sie auf den ersten Umfang reduziert werden. Ein zusätzlicher Beispielzustand zeigt Finanzen als ungeprüft. Kategorieöffnung und Aufgabeneinblendung sind lokale Demonstrationen ohne Speicherung. Browser-Regressionen mit echtem Service und Reload bleiben Voraussetzung einer späteren Produktimplementierung.

Darstellungen dieser Sitzung: `C:/Users/andi/.codex/visualizations/2026/09/10/01a08cd9-3d83-7b01-b4c8-bb61d71f6b9f/readiness-a.html`, `readiness-b.html`, `readiness-c.html`. Diese Dateien sind Gesprächsvorschauen; die Entscheidung und die fachliche Spezifikation werden im Repository gepflegt.
