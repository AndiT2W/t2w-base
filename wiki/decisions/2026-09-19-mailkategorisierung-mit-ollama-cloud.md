---
title: Mailkategorisierung mit Ollama Cloud
type: decision
status: accepted
updated: 2026-09-19
sources:
  - ../sources/2026-09-19-claude-kommunikation-design.md
---

# Mailkategorisierung mit Ollama Cloud

**Status:** als Zielbild beschlossen; erster Dry-Run umgesetzt. Nutzerkonversation vom 19.09.2026.

## Kontext

Die Kommunikationsanzeige ordnet Nachrichten künftig einem [Bezug](../concepts/communication-display-design.md#bezug-person-oder-thema) zu: einer Person oder einem Thema wie *Teilnehmer*. Die Absenderadresse reicht dafür nicht immer — Sammelmails aus dem Anmeldeportal oder Sponsorenanfragen tragen die Zugehörigkeit nur im Text. Der Nutzer will im Endausbau Ollama Cloud verwenden, um die Mails zu kategorisieren. Der [Wissensdienst für Eventkommunikation](../concepts/event-communication-knowledge-service.md) beschreibt den größeren Rahmen; diese Entscheidung betrifft nur die Bezugszuordnung.

## Entscheidung

Die Kategorisierung wird **stufenweise** gebaut, deterministisch vor Modell:

1. **Adressregeln zuerst.** Adresse oder Domain → Thema, gepflegt in den Auswahllisten. Sie decken den Regelfall ab, kosten nichts und sind der Rückfall, wenn die Cloud nicht erreichbar ist. Diese Stufe wird vor der Modellanbindung ausgeliefert.
2. **Modell als Vorschlag.** Ollama Cloud liefert genau einen Themenvorschlag je Nachricht.
3. **Bestätigte Zuordnungen** sind das Material, aus dem weitere Adressregeln entstehen.

> **Änderung vom 19.09.2026, später am selben Tag:** Stufe 1 ist auf Nutzerwunsch **zurückgestellt**.
> Das Thema wird von Hand im Nachrichtenpanel gesetzt. Damit entfällt vorerst der deterministische
> Unterbau, auf dem diese Entscheidung aufsetzt — wer die Modellstufe angeht, muss also entweder
> Stufe 1 nachholen oder begründen, warum das Modell ohne sie tragfähig ist. Die übrigen Auflagen
> (Vorschlag statt Zuordnung, serverseitig, pro Event abschaltbar) bleiben unverändert gültig.

Für die Modellstufe gilt:

- **Serverseitig.** Der Aufruf läuft im `event-service` als Job nach dem Outlook-Sync, nicht im Browser. Der Zugangsschlüssel bleibt auf dem Server, die Liste bleibt schnell, ein Ausfall der Cloud macht die Seite nicht kaputt.
- **Enges Ausgabeformat.** Das Modell bekommt Betreff, gekürzten Text und die Liste der erlaubten Themen und gibt ein Thema samt Konfidenz zurück. Werte außerhalb der Liste werden verworfen; das Modell kann keine neuen Kategorien anlegen.
- **Eigenes Feld.** Das Ergebnis landet in einem Vorschlagsfeld, nie im gesetzten Bezug. In der Oberfläche erscheint es gestrichelt mit dem Wort „Vorschlag“ und wird durch ein Häkchen übernommen. **Ohne Bestätigung wird nichts zugeordnet.**
- **Nachvollziehbar.** Übernommene und verworfene Vorschläge werden protokolliert, damit Trefferquote und Regelkandidaten beurteilbar bleiben.

## Datenschutz

Mit Stufe 2 **verlassen Mailinhalte den eigenen Server** und gehen an Ollama Cloud. Das ist eine bewusste Entscheidung mit Auflagen:

- Vor dem Scharfschalten ist die Verarbeitung zu dokumentieren und mit dem Auftragsverarbeitungsvertrag des Anbieters zu unterlegen.
- Die Kategorisierung ist **pro Event abschaltbar**; ohne Freigabe bleibt es bei den Adressregeln.
- Übertragen wird nur, was für die Einordnung nötig ist: Betreff und gekürzter Text. Anlagen werden nicht übertragen.
- Die Stufen 1 und 3 funktionieren ohne jede externe Verarbeitung. Wird die Modellstufe abgelehnt oder später abgeschaltet, bleibt die Zuordnung vollständig bedienbar.

## Konsequenzen

- Die Anzeige braucht den Vorschlagszustand, bevor das Modell existiert; sie ist im Entwurf bereits dafür ausgelegt (gestricheltes Chip, Filter „Vorschläge prüfen“).
- Datenmodell: je Nachricht ein gesetzter Bezug und ein davon getrenntes Vorschlagsfeld mit Quelle (Regel oder Modell) und Zeitpunkt.
- Die Themenliste ist konfigurierbar; das Prompt-Format muss sie zur Laufzeit übernehmen, statt sie fest zu verdrahten.

## Offene Punkte

- Modellwahl, Kosten je Sync und Verhalten bei Zeitüberschreitung sind nicht festgelegt.
- ~~Ob mehrere Themen je Nachricht zulässig sind~~ — entschieden am 19.09.2026: **genau ein Thema je Nachricht**. Das Modell liefert dementsprechend einen Wert, nicht eine Liste.
- Der Umgang mit Bestandsnachrichten — einmalige Nachkategorisierung oder nur neue Nachrichten — ist offen.

## Erster Testservice (2026-09-22)

Der erste vertikale Schnitt ist als Dry-Run im Event-Service umgesetzt. `POST /api/v1/mail-classifier/test` liefert Kategorie, Eventvorschlag, Gründe, Outlook-Markierungsplan und bei Eventfragen einen Weiterleitungsplan. Er verändert Outlook nicht und versendet nichts. Eventnamen werden ausschließlich aus der erlaubten Eventkandidatenliste übernommen; unbekannte Modellwerte führen zu `T2W | Prüfung` und einer Review-Anforderung.

Die Testkategorien modellieren die Mailabsicht getrennt vom bestehenden Kommunikationsthema. Damit wird `EVENT_QUESTION` nicht fälschlich als dauerhaftes Thema gespeichert. Die Ausarbeitung und die vorgeschlagenen Outlook-Markierungen stehen in [Mail-Klassifizierungs-Testservice](../tasks/mail-classifier-testservice.md).

Die manuelle Prüfung ist im Eventdetail unter **Kommunikation → Mail analysieren** als Sheet erreichbar. Das aktuelle Event wird als Kontext angezeigt, die Testanfrage vergleicht aber standardmäßig alle aktiven Events. So lässt sich die Eventfindung testen, ohne bereits eine Zuordnung oder Outlook-Aktion auszulösen. Der Browserablauf ist in [`mail-classifier.spec.ts`](../../tests/e2e/mail-classifier.spec.ts) abgesichert.
