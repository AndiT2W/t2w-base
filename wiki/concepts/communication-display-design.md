---
title: Kommunikation – Anzeigegrundlage
type: concept
status: active
updated: 2026-09-19
sources:
  - ../sources/2026-09-19-claude-kommunikation-design.md
---

# Kommunikation – Anzeigegrundlage

## Geltung und Stand

Diese Seite hält das am 19.09.2026 mit dem Nutzer abgestimmte Zielbild der Kommunikationsanzeige fest. Die **Anzeige selbst ist umgesetzt**; die Erweiterungen am Datenmodell stehen aus (siehe [Umsetzungsstand](#umsetzungsstand)). Vor Änderungen an der Kommunikationsanzeige diese Seite und den [Quellnachweis](../sources/2026-09-19-claude-kommunikation-design.md) lesen. Die [Timeline-UI-Notiz](../tasks/event-communication-timeline-ui.md) beschreibt die abgelöste Fassung und ist nur noch Historie.

Die visuelle Sprache ist die der [PM-Designgrundlage](project-management-design.md): Arbeitsbreite nutzen, helle Kartenflächen, dünne Trennlinien, kompakte Versalienköpfe nach dem [Tabellenstandard](shared-compact-data-tables.md), `Source Sans 3` und die [TIME2WIN-Marke](time2win-ci-branding.md). Der fachliche Rahmen bleibt der [Wissensdienst für Eventkommunikation](event-communication-knowledge-service.md).

## Aufgabe der Seite

Die Seite beantwortet **„was ist zu diesem Event gelaufen und wo finde ich es“** — nicht „wer ist am Zug“. Beantwortet, weitergeleitet und abgelegt wird in Outlook.

Daraus folgen zwei Verbote, beide aus der Nutzerentscheidung vom 19.09.2026:

- **Keine Bearbeitungszustände.** Kein „wartet auf Antwort“, kein „beantwortet“, kein Erledigt-Vermerk und keine daraus abgeleitete Dringlichkeitsfarbe. Die Seite bildet keinen zweiten Posteingang nach.
- **Keine Fortschritts- oder Kennzahlenleiste.** Der Platz gehört Suche, Filtern und sichtbaren Zeilen.

Das unterscheidet die Seite bewusst vom Projektmanagement, dessen Zustände und Fortschritt fachlich in der Anwendung entstehen.

## Zwei Einstiege

| Einstieg | Frage der Ansicht | Grundstruktur |
| --- | --- | --- |
| **Verlauf** (Einstieg) | Was ist zuletzt passiert? | Zeitgruppen mit flacher Zeilenliste |
| **Konversationen** | Was war nochmal mit diesem Thema? | Ein Thema je Zeile, eine geöffnet, Nachrichten als Kette |

Die Auswahl erscheint als Segmentleiste neben der Suche, wie „Kategorien / Zeitachse“ im Projektmanagement.

## Kopf, Suche und Filter

- Der Kopf nennt Anzahl, Zeitpunkt der letzten Synchronisation und den Outlook-Ordner in einer Zeile. Rechts stehen „Eintrag erfassen“ und „Synchronisieren“.
- Das **Suchfeld** steht über der vollen Breite und durchsucht Betreff, Absender, Adresse und Text. Treffer werden in Betreff und Vorschau hervorgehoben, die Trefferzahl steht über der Liste.
- **Filter sind eine umbrechende Chipleiste.** Erste Reihe: die Nachrichtenarten als Chips mit Symbol, Name und Anzahl. Zweite Reihe: Bezug, Richtung, Zeitraum, „mit Anlagen“, „ohne Bezug“, „Vorschläge prüfen“ und „n Filter zurücksetzen“. Aktive Auswahlfilter erhalten den Markenakzent.
- Die Zahlen an den Chips sind zugleich Bestandsangabe und Filter; sie beziehen sich auf die bereits durch die Suche gefilterte Menge.

## Liste

Vier Spalten statt sechs: **Art** (34 px), **Betreff und Vorschau**, **Bezug** (220 px), **Zeit** (80 px). Der Rest gehört dem Betreff, damit die Vorschau ganze Sätze zeigt.

- Zeitgruppen als schmale Bänder: **Heute → Diese Woche → Früher · Monat**, jeweils mit Anzahl.
- Je Eintrag zwei Zeilen: Betreff, darunter Absender beziehungsweise Empfänger und die Vorschau, beide einzeilig mit Auslassung.
- Thread- und Anlagenzahl stehen als kleine Symbole direkt hinter dem Betreff, nicht in einer eigenen Metazeile.
- Spaltenkopf nach dem Tabellenstandard: 10 px, Gewicht 700, Versalien, Haarlinie. Auf schmalen Ansichten entfällt der Kopf, die Zeilen brechen um und tragen ihre Angaben als Chips.

## Nachrichtenarten und ihre Symbole

Art und Richtung teilen sich eine 34 px breite Spalte. Sichtbar ist nur das Symbol; der Text steckt im barrierefreien Namen und im Tooltip.

| Art | Symbol | Richtungspfeil |
| --- | --- | --- |
| E-Mail | Umschlag | ja |
| WhatsApp | Sprechblase | ja |
| Telefon | Hörer | ja |
| Gespräch | zwei Personen | nein |
| Videocall | Kamera | nein |
| Notiz | Blatt | nein |

- Alle Symbole 17 px, gleiche Strichstärke; der Richtungspfeil daneben 12 px.
- **Markengrün trägt nur der Ausgang aus dem konfigurierten TIME2WIN-Postfach.** Es ersetzt das frühere Logo-Abzeichen. Alle übrigen Symbole bleiben neutral.
- **Keine Fremdlogos.** WhatsApp bekommt eine neutrale Sprechblase, nicht das Originalzeichen.
- Farbe und Symbol tragen die Bedeutung nie allein: jedes Symbol hat einen ausgeschriebenen barrierefreien Namen („E-Mail, ausgehend von TIME2WIN“).

Datenmodell: `kanal` ist ein freier Wert ([`types.ts`](../../src/lib/t2w/types.ts)); die Arten stehen als Auswahlliste `communicationChannels` unter **Einstellungen → Auswahllisten → Kommunikation / Nachrichtenarten**, mit Name, Symbol und Farbe aus derselben Palette wie Services und Eventrollen. Brief, SMS oder ein weiterer Messenger kommen ohne Codeänderung dazu. Eine unbekannte Art fällt auf die Sprechblase zurück und bleibt lesbar.

## Bezug: Person oder Thema

Die frühere Spalte „Kontakt“ heißt **Bezug** und nimmt zwei Arten von Werten:

- **Person** — blaues Chip, Eventkontakt mit Rolle, sonst CRM-Person. Blau bleibt Personen vorbehalten, wie bei den Eventkontakten.
- **Thema** — neutrales Chip mit Etikett-Symbol: *Teilnehmer, Sponsoren, Behörde, Rechnung, Presse*. Für Sammelmails, hinter denen keine einzelne Person steht.

Beides kann nebeneinander stehen; im Nachrichtenpanel sind Person und Thema getrennt änderbar. Die Themen kommen aus den Auswahllisten, nicht aus dem Code.

**Zuordnungswege:**

1. **Absenderadresse → Person.** Erst Eventkontakte, dann CRM. Bestehendes Verhalten in [`communication-timeline.ts`](../../src/lib/t2w/communication-timeline.ts).
2. **Thema von Hand im Panel.** Der gültige Weg für Themen. Umgesetzt am 19.09.2026.
3. *(zurückgestellt)* **Sammeladresse oder Domain → Thema.** Regel je Adresse oder Domain,
   etwa `anmeldung@…` → Teilnehmer. Auf Nutzerwunsch vom 19.09.2026 **vorerst nicht gebaut**:
   das Thema wird manuell gesetzt. Kein Versäumnis, sondern eine Entscheidung — vor einem Neubau
   dieser Stufe erst nachfragen.
4. *(offen)* **Textanalyse → Vorschlag.** Siehe [Entscheidung zur Mailkategorisierung](../decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md).

**Vorschläge sind kein gesetzter Bezug.** Sie erscheinen gestrichelt mit dem Wort „Vorschlag“, tragen ein Häkchen zum Übernehmen und liegen in einem eigenen Feld. Der Filter „Vorschläge prüfen“ sammelt sie. Ohne Bestätigung wird nichts zugeordnet.

## Nachrichtenpanel

Rechts öffnendes Sheet wie das [Aufgabenpanel](../../src/components/t2w/TaskDetailSheet.tsx), auf schmalen Ansichten volle Breite; Kopf und Fuß bleiben außerhalb des scrollenden Inhalts.

- Kopf: Art und Richtung als Symbol mit Text, Betreff, Thread-Navigation („Nachricht 4 von 4“) und Link zur ganzen Konversation.
- Inhalt: Von/An/Empfangen/Ordner als Zweispaltenraster, der Bezugsblock mit Person, Thema und offenem Vorschlag, der vollständige Text, Anlagen als Liste, verknüpfte Aufgaben.
- Fuß: „In Outlook öffnen“, „Aufgabe anlegen“, „Notiz anhängen“. Keine Aktion, die einen Bearbeitungszustand setzt.

## Sonderfälle

| Fall | Anzeige |
| --- | --- |
| Noch keine Einträge | „Synchronisieren“ und „Eintrag erfassen“ nebeneinander |
| Keine Treffer | Trefferzahl null mit „Filter zurücksetzen“ und der Zahl gesetzter Filter |
| Kein Outlook-Ordner | Roter Hinweis mit Weg in die Stammdaten; erfasste Einträge bleiben sichtbar |
| Synchronisation läuft | Fortschritt im Kopf, Liste bleibt bedienbar |

## Umsetzungsstand

Umgesetzt am 19.09.2026 in [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx) und
[`communication-timeline.ts`](../../src/lib/t2w/communication-timeline.ts): die zwei Einstiege statt
der drei Timeline-Varianten, der Wegfall von Zuständen und Kennzahlenleiste, die vier Spalten mit
Symbolspalte und Richtungspfeil, die Zeitgruppen, Suche mit Trefferzahl und Hervorhebung, die
Chipleiste mit Artenzählern, das Nachrichtenpanel als Sheet mit Konversationsliste und
Outlook-Deeplink sowie die Gruppe „Einzelne Einträge“.

Nachgezogen am 19.09.2026 (Schritt 1): Nachrichtenarten sind eine Auswahlliste. Migration
`0033_communication_channel_options` legt `CommunicationChannelOption` an und belegt sie mit
`E-Mail`, `Telefon` und `Notiz` (aktiv) sowie `WhatsApp`, `Gespräch` und `Videocall` (inaktiv, bis
sie gebraucht werden). `kanal` ist damit ein freier Wert; Symbol und Farbe kommen aus der
gemeinsamen Palette, eine unbekannte Art fällt auf die Sprechblase zurück. Die Filterleiste zeigt
jede konfigurierte aktive Art **und** jede Art, an der noch Einträge hängen — eine deaktivierte Art
verschwindet also erst, wenn nichts mehr an ihr hängt. Konversationen hängen jetzt am
`conversationId` statt an der Art, damit auch WhatsApp-Verläufe bündeln. Referenzen:
[Auswahllisten-Domain](../../packages/domain/src/selection-lists.ts),
[Einstellungen](../../src/routes/einstellungen.tsx), [Symbolpalette](../../src/components/t2w/ServiceBadge.tsx).

Nachgezogen am 19.09.2026 (Schritt 2, erster Teil): Der Bezug nimmt neben der Person ein Thema auf.
Migration `0034_communication_topics` legt `CommunicationTopicOption` an (vorbelegt mit Teilnehmer,
Sponsoren, Behörde, Rechnung, Presse) und ergänzt `topicId` an `EventActivity` und
`EventCommunicationMessage`. Der Fremdschlüssel löscht mit `ON DELETE SET NULL`: ein entferntes Thema
nimmt keinen Eintrag mit, der Eintrag verliert nur seinen Bezug. Zugeordnet wird im Nachrichtenpanel;
das Kommando `assign-communication-topic` läuft über dieselbe Versionsprüfung wie die übrigen
Eventmutationen. Der Server entscheidet selbst, ob der Eintrag eine Outlook-Nachricht oder eine
manuelle Notiz ist, statt die Herkunft durch die Anwendung zu reichen. „Ohne Bezug“ bedeutet jetzt
**weder Person noch Thema**; ein Themenfilter steht neben dem Bezugsfilter. Referenzen:
[Eventmutationen](../../services/event-service/src/event-mutations.ts),
[Prisma-Adapter](../../services/event-service/src/prisma-event-mutation.adapter.ts).

Noch nicht umgesetzt, weil vom Datenmodell abhängig:
- Vorschläge und der Filter „Vorschläge prüfen“ fehlen noch; sie kommen mit der
  [Mailkategorisierung](../decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md).
- Regeln für Adresse und Domain sind **zurückgestellt** (Nutzerwunsch vom 19.09.2026). Themen
  werden von Hand im Panel gesetzt; das ist der vorgesehene Weg, kein Zwischenstand.
- Der Zeitraumfilter der Chipleiste fehlt; gefiltert wird derzeit über Art, Bezug, Richtung und
  Anlagen.
- „Notiz erfassen“ legt weiterhin eine Aktivität im bestehenden Sinn an.
- Der Panelfuß trägt „In Outlook öffnen“ und „Schließen“; „Aufgabe anlegen“ und „Notiz anhängen“
  fehlen noch, ebenso die Vor-/Zurück-Pfeile im Kopf — durch die Konversationsliste im Panel ist
  jede Nachricht des Threads trotzdem mit einem Klick erreichbar.

## Offene Umsetzungsschritte

1. ~~Nachrichtenarten als Auswahlliste mit Symbol~~ — erledigt am 19.09.2026.
2. ~~Feld für den Bezug (Person und/oder Thema)~~ — erledigt am 19.09.2026. Das getrennte
   Vorschlagsfeld folgt mit der Kategorisierung; die Adress- und Domainregeln sind zurückgestellt.

**Festlegungen vom 19.09.2026** (Nutzerkonversation): Nachrichtenarten und Themen entstehen als zwei neue Kinds des vorhandenen Auswahllisten-Mechanismus — `communicationChannels` und `communicationTopics` — mit je einem Options-Modell samt `icon`, `color`, `active` und `sortOrder`, wie `ServiceOption` und `EventRoleOption`. Damit gelten Adapter, Workspace und Einstellungsoberfläche unverändert; die Sonderverwaltung von `PmGroup` wird nicht kopiert. Die drei Bestandswerte `E-Mail`, `Telefon` und `Notiz` werden als Optionen vorbelegt. Eine Nachricht trägt **genau ein Thema**; die Person bleibt ein davon getrenntes Feld, beide können nebeneinander gesetzt sein. Referenzen: [Auswahllisten-Domain](../../packages/domain/src/selection-lists.ts), [Schema](../../services/event-service/prisma/schema.prisma).
3. ~~Anzeige umbauen~~ — erledigt am 19.09.2026.
4. ~~Nachrichtenpanel als Sheet~~ — erledigt am 19.09.2026.
5. Zeitraumfilter in der Chipleiste ergänzen.
6. Erst danach die Kategorisierung nach der verlinkten Entscheidung.

Jeder Schritt braucht die Regression nach [AGENTS.md](../../AGENTS.md#feature-testing-rule): Browserablauf mit beobachtbarem Ergebnis, bei Persistenz mit Reload, dazu gezielte Tests für neue Ableitungen. Änderungen an dieser Grundlage werden hier mit Datum und Quelle eingearbeitet und im [Wartungslog](../log.md) vermerkt.
