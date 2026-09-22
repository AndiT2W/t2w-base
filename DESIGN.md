# TIME2WIN — Designgrundlage (Artboards)

Diese Datei ist die verbindliche Gestaltungsgrundlage für alle Oberflächenarbeiten in
diesem Repository. Sie fasst die freigegebenen Artboards zusammen, damit ein Agent ohne
Zugriff auf das Design-Canvas dieselben Entscheidungen trifft.

**Regel:** Jede neue Ansicht und jede Änderung an einer bestehenden Ansicht folgt dieser
Datei. Wenn Artboard und Code auseinanderlaufen, gewinnt das Artboard — außer bei den unter
[Bewusste Abweichungen](#bewusste-abweichungen) genannten Punkten.

- Quelle: Design-Canvas „TIME2WIN Seitenentwürfe", 27 Artboards
  (<https://claude.ai/artifact/LQBFcGU5npsM9LZuasSrUK>, privates Artifact des Nutzerkontos —
  nicht öffentlich abrufbar, deshalb diese Datei).
- Farbwerte im Code: [`src/styles.css`](src/styles.css) (oklch). Die Hexwerte hier sind die
  Artboard-Notation derselben Farben.
- Stand: 22.09.2026. Abgleich Oberfläche ↔ Artboards: 33 Abweichungen erhoben, 30 behoben,
  3 gestrichen (siehe [`wiki/log.md`](wiki/log.md)).

---

## 1. Was auf den Artboards steht

| Artboard                                                                                             | Inhalt                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Bausteine                                                                                            | Farben, Schrift, Bedienelemente, Tabelle, Muster — die Grundlage        |
| Navigation                                                                                           | Menü in drei Gruppen, Rollenansichten, Kopfzeile, schmale Leiste, Mobil |
| Übersicht (Main)                                                                                     | Startseite: Kennzahlkacheln, Filterleiste, Eventtabelle                 |
| Veranstaltungen / Kalender                                                                           | Liste, Reiter Liste/Kalender/Gantt                                      |
| Aufgaben                                                                                             | Gesamtübersicht über alle Events                                        |
| Event — Stammdaten, Anmeldung, Finanz, Kontakte, Projektmanagement, Dateien, Kommunikation, Hardware | die acht Detailreiter                                                   |
| Kunden & Kontakte, Hardware, Auszahlungen                                                            | weitere Module                                                          |
| Einstellungen — Allgemein, Benutzer, Auswahllisten, Outlook, Auditlog                                | Einstellungen                                                           |
| Übersicht — Mobil                                                                                    | 390 × 844, Schublade + untere Modulleiste                               |
| Paletten / Palette-Wald, -Blau, -Papier                                                              | verworfene Farbvorschläge, **nicht** umsetzen                           |

Desktop-Artboards sind 1440 px breit (Navigation/Bausteine 1900 px), Eventdetails 1160 px
hoch, Listen 980 px. Mobil ist 390 × 844.

---

## 2. Farben

Im Code **immer** über die semantischen Tailwind-Klassen bzw. CSS-Variablen aus
`src/styles.css`. Nie ein Hexwert, nie `dark:` (es gibt nur einen hellen Modus; der dunkle
wurde am 21.09.2026 entfernt).

### Marke

| Rolle                       | Variable / Klasse                          | Artboard-Hex |
| --------------------------- | ------------------------------------------ | ------------ |
| Navy                        | `--brand-navy`, `bg-nav`                   | `#001131`    |
| Markengrün                  | `--brand-green`, `--primary`, `bg-primary` | `#92bf11`    |
| Grün dunkel (Rahmen, Links) | `--primary-ink` im Artboard                | `#4d7800`    |

**Schrift auf Grün ist Navy, nie Weiß.** Weiß auf dem Markengrün ergibt 2,2:1 und ist
unlesbar; Navy auf Grün sind 8,6:1. Im Code: `--primary-foreground: var(--brand-navy)`.
Das Grün selbst bleibt unverändert.

### Flächen und Text

| Rolle                     | Klasse                  | Hex       |
| ------------------------- | ----------------------- | --------- |
| Seitengrund               | `bg-background`         | `#f9fafc` |
| Karte / Tabelle           | `bg-card`, `bg-surface` | `#ffffff` |
| Rahmen (trennt Flächen)   | `border-border`         | `#dfe3e8` |
| Rahmen an Bedienelementen | `border-input`          | `#909396` |
| Text                      | `text-foreground`       | `#192029` |
| Hilfstext                 | `text-muted-foreground` | `#646d78` |

`--border` ist hell und trennt nur Flächen. Eingabefelder und Schaltflächen tragen
`--input`, weil Bedienelemente 3:1 brauchen.

### Eventstatus (Lieferstatus)

Jeder Status hat eine eigene Farbe; die Töne stehen 45–90° auseinander.

| Status           | Klasse                    | Hex                         |
| ---------------- | ------------------------- | --------------------------- |
| Zugesagt         | `bg-status-zugesagt`      | `#127951`                   |
| Anfrage          | `bg-status-angefragt`     | `#cb8418`                   |
| Angebot gesendet | `bg-status-angebot`       | `#3a81d7`                   |
| Akquise          | `bg-status-akquise`       | `#9b4bbb`                   |
| Datum prüfen     | `bg-status-datum-pruefen` | `#7a8798` (bewusst neutral) |
| Storniert        | `bg-status-storniert`     | `#f04d4b`                   |

### Aufgabenzustand (Arbeitsstatus)

Fachlich getrennt von den Eventstatus. Je Zustand drei Werte: Fläche (`--task-*`),
Chipgrund (`--task-*-soft`), Chiptext auf dem Chipgrund (`--task-*-strong`, ≥ 4,5:1).

| Zustand    | Fläche    | Chipgrund | Chiptext  |
| ---------- | --------- | --------- | --------- |
| erledigt   | `#258e6a` | `#def5ea` | `#0e6549` |
| in Arbeit  | `#3e83a8` | `#e1f1fb` | `#19517b` |
| wartet     | `#c7852a` | `#ffeccd` | `#754b10` |
| überfällig | `#db423c` | `#ffe3df` | `#9b1f1d` |
| offen      | `#c5cbd2` | `#eff2f5` | `#4e5661` |

**Farbe trägt die Bedeutung nie allein.** Jeder Chip nennt den Zustand im Text, jeder
Statuspunkt hat Tooltip und Screenreader-Text, jede Tabelle mit Punkten hat eine Legende.

---

## 3. Schrift

Source Sans 3 für alles (`--font-sans`), eine Familie, keine zweite.

| Rolle         | Größe / Stärke                                    |
| ------------- | ------------------------------------------------- |
| Seitentitel   | 25 px / 700, `letter-spacing: -0.015em`           |
| Abschnitt     | 15 px / 700                                       |
| Kartentitel   | 14 px / 700                                       |
| Fließtext     | 13,5 px / 400                                     |
| Tabellenzelle | 13 px / 400                                       |
| Hilfstext     | 12 px / 400                                       |
| Kennzahl      | 25 px / 700, `font-variant-numeric: tabular-nums` |

Zahlen in Tabellen und Kennzahlen immer tabellar.

---

## 4. Raster und Radien

- Raster 8 px, Abstände als Vielfache.
- Radius 8 px an Bedienelementen (`--radius`, `rounded-lg`), 12 px an Karten und Kacheln
  (`rounded-xl`), volle Rundung an Filterchips und Zustandschips.
- Inhaltsfläche: `padding: 20px 26px 0`, Spaltenabstand 13 px zwischen Seitenkopf,
  Reitern, Filterleiste und Liste.
- Touchziele mindestens 44 px (`min-h-11`), ab `md` darf die kompakte Höhe greifen
  (`md:min-h-8`).

---

## 5. Gerüst jeder Seite

```
┌ Seitenleiste 248px ┬ Kopfzeile 56px (globale Suche · Sprache · Hilfe) ┐
│ Module             ├──────────────────────────────────────────────────┤
│ Finanzen           │ Brotkrume                                        │
│ System             │ Seitentitel            [Nebenaktion][Hauptaktion]│
│ ─────────          │ Zählzeile („256 von 764 Events")                 │
│ Konto              ├ Reiter (Unterstrich) ────────────────────────────┤
│                    │ Kennzahlkacheln                                  │
│                    │ Filterleiste (Chips … rechts Spalten, Export)    │
│                    │ Tabelle / Inhalt                                 │
└────────────────────┴──────────────────────────────────────────────────┘
```

### Seitenleiste

- Drei Gruppen mit Versalien-Überschrift: **Module** (Übersicht, Veranstaltungen,
  Aufgaben, Kunden & Kontakte, Hardware), **Finanzen** (Auszahlungen, Angebote,
  Rechnungen), **System** (Einstellungen, Bausteine).
- Navy-Grund, Einträge 14 px, aktiver Eintrag: grüne linke Kante **und** Halbfett **und**
  hellerer Grund — nie Farbe allein.
- **Kein Eintrag trägt eine Zahl.** Was drängt, steht auf der Übersicht; die Navigation
  sagt nur, wo man ist und wohin man kann.
- Was ein Konto nicht darf, **erscheint gar nicht** — nicht ausgegraut. Benutzer ohne
  Finanzzugriff sehen die Gruppe Finanzen vollständig nicht. Veranstalterkonten sehen nur
  „Aufgaben" und haben keine Suche.
- Konto unten: Initialen auf Grün, Name, „Rolle · Zugriff" (nicht die Adresse).
- Schmale Leiste (68 px, nur Symbole) für Gantt und Kalender; Name im Tooltip, Zustand pro
  Gerät im Browser gemerkt.

### Kopfzeile

56 px hoch, weiß, eine Haarlinie unten. Links die **globale Suche** (430 px) — sie liegt
über allen Modulen, nicht in der einzelnen Seite. Rechts Sprachwahl und Hilfe.
Suche: ein Feld, drei Trefferarten (Events, Personen, Hardware), Präfix je Wort, ab zwei
Zeichen, fünf Treffer je Gruppe.

### Seitenkopf

Brotkrume (12 px, letzter Teil fett und dunkel) → `h1` 25/700 → eine Zählzeile mit der
gefilterten Menge. Rechts die Aktionen; die Hauptaktion trägt Navy auf Grün mit
`+`-Symbol.

### Reiter

Unterstrich-Stil: Leiste mit Haarlinie unten, aktives Feld 700/dunkel mit 2,5 px grünem
Balken auf der Linie, inaktive 500/grau. **Normalschreibung, keine Großbuchstaben.**

### Kennzahlkacheln

Weiße Kachel, 12 px Radius, Symbol + Label in 12 px grau, Wert 25/700 tabellar, optional
eine Hinweiszeile. **Jede Kachel ist zugleich ein Filter** — anklicken setzt die Liste
darunter, der gesetzte Zustand bekommt einen grünen Rahmen (`aria-pressed`).
Ton `warn`/`krit` färbt nur die Zahl, nie die Fläche.
Erläuterungen hängen an der Kachel und erscheinen bei Überfahren, Tastaturfokus **und**
Antippen — kein reiner Hover-Effekt.

### Filterleiste

Eine Leiste für alle Listen: runde Chips mit Label + Wert + Chevron. Gesetzte Chips tragen
grünen Rahmen und grünlichen Grund und setzen den Wert fett; ungesetzte bleiben weiß mit
`--input`-Rahmen. Rechtsbündig immer Spaltenwahl und Export, auf jeder Seite an derselben
Stelle. Nackte Auswahlfelder über der Tabelle gibt es nicht mehr.

### Tabelle

Ein Kopf, eine Zeilenhöhe, eine Sortierung — auf jeder Seite gleich.
Spaltenkopf: normal große, **kräftige** Schrift in dunkler Vordergrundfarbe auf leicht
getönter Fläche, Haarlinie zur ersten Zeile (kein 2-px-Balken, keine kleinen grauen
Versalien). Der Kopf klebt beim Scrollen unter dem Seitenkopf
(`--t2w-page-header-bottom`) und ist deckend, nicht durchscheinend.
Erste Spalte: Statuspunkt. Unter der Tabelle die Statuslegende.

### Datensatz öffnen

**Eine Zeile anklicken öffnet den Datensatz im Sheet von rechts (576 px), sofort
bearbeitbar, unten dieselbe Speicherleiste wie die Eventseite. Anlegen öffnet dasselbe
Sheet, nur leer. Das gilt auf jeder Liste.** Der modale Dialog bleibt Rückfragen mit genau
einer Entscheidung vorbehalten („Auszahlung stornieren?"). Die gefährliche Aktion sitzt
links unten, weit weg vom Speichern.

### Leerzustand

Symbol, eine Zeile Titel („Keine Events für diese Filter"), eine Zeile Erklärung, eine
Schaltfläche („Filter zurücksetzen").

---

## 6. Eventdetail

Kopf über allen acht Reitern: Brotkrume, Eventname 25/700, darunter Veranstalter · Zeitraum
· Eventcode, rechts der Statuschip. Bei Änderungen erscheint „Ungespeicherte Änderungen" +
„Änderungen speichern". Darunter die Serienzeile (andere Ausgaben) und „Zuletzt geändert …
von …".

Acht Reiter: Stammdaten · Anmeldung · Finanz · Kontakte · Projektmanagement · Dateien ·
Kommunikation · Hardware.

Inhalt in **kleinen Karten** (`rounded-xl`, `border-border`, `bg-card`, `p-4`,
Kartentitel 14/700) plus einer schmalen Schiene rechts — nicht in wenigen sehr breiten
Blöcken mit `p-6`. Gefahrenbereich (Archivieren, Stornieren) steht unten in der Schiene.

Projektmanagement gibt für die Detailreiter den Ton vor: Fortschrittsband, Kategorienkarten
mit „x von y erledigt · nächster Schritt", Zustandschips mit Anzahl, drei Ansichten
(Kategorien / Zeitachse / Abläufe).

---

## 7. Mobil (unter 768 px)

- Aus der Seitenleiste wird eine Schublade hinter dem Menüknopf.
- Die fünf Hauptmodule liegen zusätzlich als Leiste am unteren Rand (Übersicht, Events,
  Aufgaben, Kontakte, Hardware); aktiv = grünes Symbol + fetter Text.
- Navy-Kopfzeile mit Menüknopf, Titel + Unterzeile, Suchknopf.
- Kennzahlen nebeneinander, dann Filterchips, dann Karten statt Tabelle: Statuspunkt,
  Name, Chevron, Code · Datum, darunter Zustandschips.
- Kennzahlkacheln dürfen nicht aus dem Bild ragen.

---

## 8. Barrierefreiheit — nicht verhandelbar

- Text auf Fläche mindestens 4,5:1, Rahmen und Statuspunkte mindestens 3:1.
- Farbe ist nie der alleinige Träger einer Aussage: zusätzlich Text, Kante, Schriftstärke
  oder Symbol.
- Echte Elemente: `<button>`, `<a href>`, `<input>` + `<label>`. Nie `role`/`onClick` auf
  einem `div`. `aria-label` an Schaltflächen, die nur ein Symbol tragen.
- Zustände über `aria-pressed` (Schaltflächen) bzw. `aria-current` (Links), nicht nur über
  die Fläche.
- Symbole: Lucide-Strichsymbole, `stroke-width: 1.7`, nie Emoji.
- Kein `dark:` — es gibt nur den hellen Modus.

---

## 9. Bestehende Bausteine im Code

Vor jeder neuen Komponente hier nachsehen; diese Teile setzen das Artboard bereits um.

| Artboard-Muster                       | Datei                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Seitenleiste, Gruppen, Rollen         | `src/components/t2w/AppSidebar.tsx`                                                         |
| Kopfzeile mit globaler Suche          | `src/components/t2w/AppTopbar.tsx`, `GlobalSearch.tsx`                                      |
| Untere Modulleiste (mobil)            | `src/components/t2w/MobileNav.tsx`                                                          |
| Seitenkopf (Brotkrume, Titel, Aktion) | `src/components/t2w/PageHeader.tsx`                                                         |
| Reiter im Unterstrich-Stil            | `src/components/t2w/Segment.tsx`, `EventViewTabs.tsx`                                       |
| Kennzahlkachel                        | `src/components/t2w/MetricTile.tsx`                                                         |
| Filterleiste und Chips                | `src/components/t2w/FilterBar.tsx`, `FilterChip.tsx`                                        |
| Tabelle, Spaltenwahl, Export          | `src/components/t2w/DataTable.tsx`, `table-model.ts`, `.t2w-data-table` in `src/styles.css` |
| Sheet für Datensätze                  | `src/components/t2w/RecordSheet.tsx`                                                        |
| Karte auf Detailseiten                | `src/components/t2w/DetailKarte.tsx`                                                        |
| Statuspunkt und -chip                 | `src/components/t2w/StatusBadge.tsx`                                                        |
| Aufgabenzustand                       | `src/components/t2w/TaskState.tsx`, `TaskSummary.tsx`, `TaskCategory.tsx`                   |
| Mobile Eventliste                     | `src/components/t2w/EventMobileList.tsx`                                                    |

Unterbau: shadcn/ui unter `src/components/ui/`. Diese Dateien werden angepasst, nicht
ersetzt — `tabs.tsx` trägt bereits den Artboard-Unterstrich.

Eine gerenderte Übersicht der Bausteine liegt unter der Route `/styleguide`.

---

## 10. Bewusste Abweichungen

| Punkt                   | Artboard                | Code                | Grund                                                                                                            |
| ----------------------- | ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Schriftstärke im Reiter | 700 aktiv / 500 inaktiv | beide `font-medium` | Fetterer Text ist breiter und ließ die Leiste beim Umschalten ruckeln; Farbe und Unterstrich tragen den Zustand. |
| Farbnotation            | Hex                     | oklch               | `src/styles.css` ist die Quelle; die Hexwerte hier sind nur die Artboard-Notation.                               |

Die Breite der Seitenleiste ist seit 22.09.2026 angeglichen: 248 px in der Grundstellung,
68 px schmal, als `SIDEBAR_BREITE` und `SIDEBAR_ABSTAND` in
[`AppSidebar.tsx`](src/components/t2w/AppSidebar.tsx). Leiste und linker Abstand der
Inhaltsfläche lesen denselben Wert — beim Ändern nie nur eine der beiden Stellen anfassen.
Die Schublade auf dem Telefon bleibt bei 256 px; sie liegt über dem Inhalt und teilt die
Breite nicht mit ihm.

Gestrichen ohne Umsetzung (keine Dienstschnittstelle vorhanden, es soll auch keine gebaut
werden): „Importieren" bei den Kontakten, „Neue Aufgabe" mit Eventbezug auf der
Aufgabenseite, „Sammelexport" der Auszahlungen.

Die drei Palettenvorschläge (Waldgrün, Tiefblau, Papier) sind **Vorschläge, keine
Vorgabe** — die CI-Palette bleibt.

---

## 11. Arbeitsweise für neue Oberflächen

1. Prüfen, ob es zur Ansicht ein Artboard gibt (Abschnitt 1). Wenn ja, ihm folgen.
2. Für neue Ansichten ohne Artboard: das nächstliegende Muster übernehmen — Liste =
   Seitenkopf + Reiter + Kennzahlen + Filterleiste + Tabelle + Sheet; Detailseite =
   Eventdetail-Gerüst mit kleinen Karten.
3. Nur bestehende Bausteine aus Abschnitt 9 verwenden. Ein neuer Baustein entsteht erst,
   wenn das Muster zweimal gebraucht wird, und kommt dann nach `src/components/t2w/`.
4. Nie Hexwerte im Code, nie `dark:`, nie Farbe als alleiniger Bedeutungsträger.
5. Jede zusätzliche Funktion braucht im selben Änderungssatz einen Regressionstest, am
   liebsten als Browser-E2E über den vollständigen Ablauf — siehe
   [`AGENTS.md`](AGENTS.md#feature-testing-rule).
6. Ändern sich Gestaltungsregeln, diese Datei und [`wiki/log.md`](wiki/log.md) nachziehen.

Weiterführend im Wiki:
[Projektmanagement-Anzeige](wiki/concepts/project-management-design.md),
[Kommunikationsanzeige](wiki/concepts/communication-display-design.md),
[Eventlisten-Anzeige](wiki/concepts/event-list-display-design.md),
[Kompakte Tabellen](wiki/concepts/shared-compact-data-tables.md),
[CI und Branding](wiki/concepts/time2win-ci-branding.md).
