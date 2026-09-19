# Quelle: Claude-Überarbeitung der Kommunikationsanzeige

## Auftrag

Nutzerkonversation vom 19.09.2026: Die Anzeige der Kommunikationsseite überarbeiten, „ähnlich wie die Projektmanagementanzeige“. Daraus folgt die [Anzeigegrundlage Kommunikation](../concepts/communication-display-design.md).

Der Entwurf entstand als Design-Canvas mit fünf Artboards (Verlauf, Konversationen, Nachrichtenpanel, schmale Ansicht, Symbole/Bezug/Sonderfälle): <https://claude.ai/artifact/6dqevUuXrBr2B27rWfZJhz> (privates Artifact des Nutzerkontos). Farben, Radien und Schrift stammen unverändert aus [`src/styles.css`](../../src/styles.css); ein separates Design-System-Artifact war ohne `tokens.json` und wurde nicht verwendet.

## Nutzerentscheidungen im Verlauf der Konversation

1. **Erster Entwurf** übertrug die PM-Muster: Zusammenfassung mit segmentiertem Balken, Dringlichkeitsfilter, Zustände „wartet auf Antwort / beantwortet“, amber linke Kante.
2. **Korrektur:** Zustände entfallen ersatzlos, weil E-Mails in Outlook beantwortet werden. Die Kennzahlenleiste („11 beantwortet, 4 warten …“) entfällt ebenfalls. Art und Richtung sollen erkennbar sein, aber wenig Platz brauchen, gerne als Symbole. Leitfrage der Seite ist „schnell Infos finden“.
3. **Erweiterung:** Symbole je Nachrichtenart – Telefon, Mail, WhatsApp, Gespräch und weitere.
4. **Erweiterung:** „Teilnehmer“ soll als Bezug wählbar sein, wenn es global um Teilnehmer geht und keine einzelne Person passt. Offene Frage des Nutzers: wie zugeordnet wird.
5. **Ausblick des Nutzers:** Im Endausbau soll Ollama Cloud die Mails kategorisieren. Siehe [Entscheidung zur Mailkategorisierung](../decisions/2026-09-19-mailkategorisierung-mit-ollama-cloud.md).

## Geprüfter Ist-Zustand

Repository-Stand `81c694b3` vom 19.09.2026. Die laufende Oberfläche entspricht noch nicht dem Entwurf:

| Punkt | Ist-Zustand im Code |
| --- | --- |
| Ansichtswahl | Drei Timeline-Varianten „Hybrid / Dialog / Kompakt“ in [`events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx) |
| Nachrichtenarten | `kanal: "E-Mail" \| "Telefon" \| "Notiz"` in [`types.ts`](../../src/lib/t2w/types.ts) |
| Zuordnung | Nur Person über die Absenderadresse in [`communication-timeline.ts`](../../src/lib/t2w/communication-timeline.ts); kein Themenbezug |
| Kategorisierung | Nicht vorhanden; das Vorhaben ist als [Wissensdienst](../concepts/event-communication-knowledge-service.md) beschrieben, aber nicht umgesetzt |

## Grenzen

Diese Dokumentation beschreibt ein Zielbild aus einem Entwurf, keine ausgelieferte Funktion. Es wurden keine Tests ausgeführt und kein Code geändert. Die Umsetzung braucht die Regression nach [AGENTS.md](../../AGENTS.md#feature-testing-rule).
