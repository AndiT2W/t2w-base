# Mehrsprachiges Produktdesign

## Grundsatz

GCW Base wird von Beginn an mehrsprachig konzipiert. Deutsch ist die Standardsprache und wird zuerst vollständig unterstützt; Englisch wird parallel als zweite Sprache unterstützt.

## Designanforderungen

- Alle sichtbaren UI-Texte müssen übersetzbar sein und dürfen nicht fest in Komponentenlogik verbleiben.
- Deutsch (`de`) ist die Standardsprache und Fallback-Sprache.
- Englisch (`en`) ist ab dem ersten nutzbaren Release verfügbar.
- Fachbegriffe, Statuswerte, Rollen, Validierungsfehler, leere Zustände, Benachrichtigungen und Systemmeldungen gehören zum Übersetzungsumfang.
- Datums-, Zeit-, Zahlen- und gegebenenfalls Währungsdarstellung müssen locale-aware sein.
- Übersetzungen dürfen keine Annahme über feste Textlängen treffen; Layouts müssen längere englische oder deutsche Texte verkraften.
- Sprachumschaltung und bevorzugte Sprache sollen als Benutzereinstellung vorgesehen werden.
- Persistierte fachliche Codes und API-Werte bleiben sprachneutral/stabil; ihre Darstellung wird je Sprache übersetzt.

## Umsetzungsreihenfolge

1. Übersetzungsmechanismus und Sprachschlüssel als Teil der Basisarchitektur einführen.
2. Deutsche Texte vollständig als Default hinterlegen.
3. Englische Übersetzungen parallel zu jeder neuen Funktion ergänzen.
4. Browser-/E2E-Tests für zentrale Abläufe mindestens in deutscher Standardsprache und für die Sprachumschaltung ergänzen.

Quelle: Nutzerentscheidung aus der Unterhaltung vom 2026-08-20.
