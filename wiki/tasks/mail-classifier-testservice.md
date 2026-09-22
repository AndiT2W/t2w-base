---
title: Mail-Klassifizierungs-Testservice
type: task
status: prototype
updated: 2026-09-22
sources:
  - ../decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md
  - ../../services/event-service/src/mail-classifier/mail-classifier.service.ts
  - ../../services/event-service/src/mail-classifier/mail-classifier.controller.ts
  - ../../src/components/t2w/MailClassifierTestSheet.tsx
  - ../../tests/e2e/mail-classifier.spec.ts
---

# Mail-Klassifizierungs-Testservice

## Ziel

Ein serverseitiger Dry-Run prüft eine Mail gegen eine erlaubte Kandidatenliste von Events und liefert einen nachvollziehbaren Vorschlag zurück. Der Dienst ändert Outlook noch nicht und versendet keine Mail.

Der Testendpunkt ist `POST /api/v1/mail-classifier/test`. Wenn keine Eventkandidaten mitgegeben werden, lädt er bis zu 500 nicht archivierte Events aus dem Event-Service. Die Ausgabe enthält:

- eine fachliche Kategorie und Konfidenz,
- eine Eventzuordnung nur aus der übergebenen Kandidatenliste,
- Gründe und eine erkannte Frage,
- einen Outlook-Markierungsplan,
- bei einer Eventfrage einen Weiterleitungsplan mit `requiresApproval: true`.

## Testoberfläche

Der erste Test ist im Eventdetail unter **Kommunikation → Mail analysieren** als rechtes Sheet eingebaut. Das aktuelle Event dient als sichtbarer Kontext; die Analyse vergleicht die Mail trotzdem mit allen aktiven Events, damit gerade der problematische Fall „Veranstaltung unbekannt“ getestet werden kann. Das Sheet zeigt Eingabefelder für Absender, Empfänger, Betreff und Mailtext sowie den kompletten Vorschlag.

Der Ablauf ist bewusst ein Dry-Run: kein Outlook-Update, kein Verschieben, keine automatische Betreffänderung und kein Versand. Die Weiterleitung wird nur als Entwurf mit dem Hinweis „Noch nicht freigegeben — kein Versand“ angezeigt.

## Kategorien

Eventbezug und Mailabsicht bleiben getrennt. Ein Event ist keine Kategorie, sondern eine Zuordnung. Die folgenden Absichten sind für den ersten Test ausreichend:

| Kategorie | Zweck |
| --- | --- |
| `EVENT_QUESTION` | konkrete Frage zu Ablauf, Regeln, Ort oder Termin |
| `EVENT_UPDATE` | Änderung oder neue Information zu einem Event |
| `REGISTRATION` | Anmeldung, Nachmeldung oder Registrierungsprozess |
| `PARTICIPANTS` | Teilnehmer, Startlisten, Startnummern oder Ergebnisse |
| `FINANCE` | Preise, Zahlung, Budget oder Bankdaten |
| `INVOICE` | Rechnung, Beleg oder Rechnungsadresse |
| `OFFER_REQUEST` | Anfrage, Angebot oder Leistungsumfang |
| `SPONSORSHIP` | Sponsoren, Partnerleistungen oder Gegenleistungen |
| `TECHNICAL` | Portal, Upload, Schnittstelle oder technisches Problem |
| `INTERNAL` | interne Abstimmung ohne direkte Veranstalteraktion |
| `NO_ACTION` | reine Information oder Ablage |
| `OTHER` | unklarer oder noch nicht modellierter Fall |

Die bestehenden Kommunikationsthemen (`Teilnehmer`, `Rechnung`, …) sind ein separater, manuell bestätigbarer Bezug. `EVENT_QUESTION` darf deshalb nicht einfach als Thema gespeichert werden.

## Outlook-Markierung

Der Dry-Run schlägt folgende Kombination vor:

1. **Kategorie:** feste Kategorien wie `T2W | Event`, `T2W | Frage`, `T2W | Finanzen` und `T2W | Prüfung`. Diese Kategorien sollten einmalig im Outlook-Postfach mit Farben angelegt werden.
2. **Betreffpräfix:** bei sicherem Treffer `[Eventcode · Eventname] Originalbetreff`. Der Name wird aus dem Event-Kandidaten übernommen, nie aus einer freien Modellantwort.
3. **Eventordner:** bei sicherem Treffer kann die Mail in den bereits bestehenden Eventordner verschoben werden. Dieser Ordner bleibt die belastbare Eventrelation.
4. **Flag:** erkannte Eventfragen erhalten einen Follow-up-Flag. Die Anwendung behauptet dadurch nicht, dass die Frage beantwortet ist.
5. **Prüfung:** unsichere oder mehrdeutige Mails erhalten nur `T2W | Prüfung`; kein Eventname wird ergänzt und keine Mail wird verschoben.

Das Betreffpräfix ist sichtbar und praktisch, kann aber Threadbetreffs verändern. Deshalb ist es im Test nur ein Vorschlag. Für den produktiven Betrieb sind Kategorie plus Eventordner die sicherere Primärmarkierung; der Präfix sollte optional bleiben.

## Eventfragen und Freigabe

Bei `EVENT_QUESTION` und sicherem Eventtreffer wird ein Weiterleitungsplan erzeugt. Er enthält Empfänger, neuen Betreff und eine kurze Zusammenfassung. Der Testservice führt die Weiterleitung nicht aus. Ein späterer Freigabeschritt muss:

- den Vorschlag explizit bestätigen lassen,
- Empfänger aus dem gespeicherten Veranstalterkontakt nehmen,
- die Freigabe und den tatsächlichen Graph-Versand auditieren,
- bei fehlender Veranstalteradresse blockieren,
- nach dem Versand die ursprüngliche Mail und die ausgehende Mail verknüpfen.

Damit bleibt die Kommunikationsanzeige eine Historie; „offene Frage“ und Freigabe gehören in die Review-/Aufgabenlogik und nicht als zweiter Bearbeitungsstatus in die Timeline.

## Ollama Cloud

Der Schlüssel wird ausschließlich serverseitig über `OLLAMA_API_KEY` gelesen. Der Dienst sendet Betreff, Absender/Empfänger und höchstens 8.000 Zeichen Text; Anlagen werden nicht übertragen. Da Ollama Cloud aktuell keine Structured Outputs unterstützt, fordert der Client JSON per Prompt an und validiert die erlaubten Kategorien und Eventcodes danach nochmals serverseitig.

## Deployment

Der Event-Service ist bereits ein eigener Compose-Container. Für den gewünschten Betrieb reicht deshalb die direkte Cloud-Anbindung aus: `OLLAMA_API_URL=https://ollama.com/api/chat`, `OLLAMA_API_KEY` und `OLLAMA_CLOUD_MODEL`. Ein zusätzlicher Ollama-Container würde kein lokales Modell beitragen und nur einen unnötigen Proxy-/Authentifizierungsweg einführen.

## Nächste Ausbaustufen

1. Vorschläge mit Message-ID, Modell, Prompt-Version und Rohantwort persistieren.
2. Einen idempotenten Outlook-Apply-Schritt für `categories`, optionalen Betreffpräfix und Eventordner ergänzen.
3. Review-UI mit „Übernehmen“, „Verwerfen“ und „anderes Event wählen“ bauen.
4. Erst danach einen expliziten Forward-Approval-Schritt mit Graph-Forward und Auditlog bauen.
5. Bestätigte Zuordnungen zur Pflege von Adress-/Domainregeln verwenden.
