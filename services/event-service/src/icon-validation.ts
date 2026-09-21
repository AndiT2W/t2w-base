/**
 * Prüfung hochgeladener Symbole.
 *
 * Ein SVG ist ausführbares Dokument, kein Bild: es kann Skript, externe
 * Verweise und Ereignisbehandler tragen. Ein unbereinigtes SVG in der
 * Symbolbibliothek führte fremden Code überall dort aus, wo das Symbol
 * erscheint — also in jeder Tabellenzeile.
 *
 * Deshalb gilt eine Positivliste: was nicht ausdrücklich erlaubt ist, führt
 * zur **Ablehnung mit Begründung**, nicht zu stiller Bereinigung. Still
 * bereinigen zerstört ein Symbol, ohne dass der Hochladende erfährt warum;
 * er sieht etwas Kaputtes und probiert es wieder.
 */

export type IconPruefung = { ok: true; monochrome: boolean } | { ok: false; grund: string };

/** Größte erlaubte Datei. Symbole sind Piktogramme, keine Bilder. */
export const MAX_ICON_BYTES = 50 * 1024;

export const ERLAUBTE_ICON_TYPEN = ["image/svg+xml", "image/png"] as const;

const ERLAUBTE_ELEMENTE = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "title",
  "desc",
  "defs",
  "use",
]);

/**
 * Elemente, die Code oder fremde Inhalte einschleusen können. Sie werden
 * einzeln genannt, damit die Begründung sagen kann, woran es lag.
 */
const VERBOTENE_ELEMENTE = new Set([
  "script",
  "style",
  "foreignobject",
  "image",
  "iframe",
  "embed",
  "object",
  "animate",
  "animatetransform",
  "set",
  "handler",
]);

const ELEMENT = /<\s*\/?\s*([a-zA-Z][a-zA-Z0-9:-]*)/g;
const ATTRIBUT = /\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=/g;
const FARBE = /(?:fill|stroke)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-zA-Z]+)/g;

function svgPruefen(inhalt: string): IconPruefung {
  if (!/<\s*svg[\s>]/i.test(inhalt)) return { ok: false, grund: "Die Datei enthält kein SVG." };

  for (const treffer of inhalt.matchAll(ELEMENT)) {
    const name = (treffer[1] ?? "").toLowerCase().replace(/^svg:/, "");
    if (VERBOTENE_ELEMENTE.has(name))
      return { ok: false, grund: `Das Element <${name}> ist in Symbolen nicht erlaubt.` };
    if (!ERLAUBTE_ELEMENTE.has(name))
      return { ok: false, grund: `Das Element <${name}> ist in Symbolen nicht vorgesehen.` };
  }

  for (const treffer of inhalt.matchAll(ATTRIBUT)) {
    const name = (treffer[1] ?? "").toLowerCase();
    if (name.startsWith("on"))
      return { ok: false, grund: `Das Attribut ${name} führt Code aus und ist nicht erlaubt.` };
    if (name === "href" || name === "xlink:href")
      return { ok: false, grund: "Verweise auf andere Dateien sind in Symbolen nicht erlaubt." };
  }

  if (/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(inhalt))
    return { ok: false, grund: "Eigene Entitäten sind in Symbolen nicht erlaubt." };

  /*
   * Einfärbbar ist nur, was höchstens eine Farbe nennt. Sonst würde aus einem
   * zweifarbigen Vereinslogo beim Einfärben ein einfarbiger Klumpen — die
   * Oberfläche zeigt dann "nicht einfärbbar" statt still das Falsche zu tun.
   */
  const farben = new Set(
    [...inhalt.matchAll(FARBE)]
      .map((treffer) => (treffer[1] ?? "").toLowerCase())
      .filter((farbe) => farbe !== "none" && farbe !== "currentcolor" && farbe !== "transparent"),
  );
  return { ok: true, monochrome: farben.size <= 1 };
}

const PNG_MAGIE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngPruefen(inhalt: Buffer): IconPruefung {
  if (!inhalt.subarray(0, 8).equals(PNG_MAGIE))
    return { ok: false, grund: "Die Datei ist kein PNG." };
  // Breite und Höhe stehen im IHDR-Block ab Byte 16.
  if (inhalt.length < 24) return { ok: false, grund: "Das PNG ist unvollständig." };
  const breite = inhalt.readUInt32BE(16);
  const hoehe = inhalt.readUInt32BE(20);
  if (breite !== hoehe)
    return { ok: false, grund: `Das Symbol muss quadratisch sein (${breite} × ${hoehe}).` };
  // Ein PNG bringt seine Farben mit; die gewählte Farbe greift nicht.
  return { ok: true, monochrome: false };
}

export function symbolPruefen(mimeType: string, inhalt: Buffer): IconPruefung {
  const typ = mimeType.trim().toLowerCase();
  if (!(ERLAUBTE_ICON_TYPEN as readonly string[]).includes(typ))
    return { ok: false, grund: "Erlaubt sind nur SVG und PNG." };
  if (!inhalt.length) return { ok: false, grund: "Die Datei ist leer." };
  if (inhalt.length > MAX_ICON_BYTES)
    return {
      ok: false,
      grund: `Das Symbol darf höchstens ${MAX_ICON_BYTES / 1024} KB groß sein.`,
    };
  return typ === "image/png" ? pngPruefen(inhalt) : svgPruefen(inhalt.toString("utf8"));
}
