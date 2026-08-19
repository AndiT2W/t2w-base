const UMLAUTE: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "ae",
  Ö: "oe",
  Ü: "ue",
  ß: "ss",
  é: "e",
  è: "e",
  ê: "e",
  á: "a",
  à: "a",
  â: "a",
  ó: "o",
  ò: "o",
  ô: "o",
  í: "i",
  ú: "u",
  ñ: "n",
  ç: "c",
};

/** Bereinigt einen Eventnamen zu einem Kurznamen für den Eventcode. */
export function kurzname(name: string): string {
  let s = name.toLowerCase();
  s = s.replace(/[äöüßÄÖÜéèêáàâóòôíúñç]/g, (c) => UMLAUTE[c] ?? c);
  // Jahreszahlen entfernen (1900-2099 sowie '25 / 26)
  s = s.replace(/\b(19|20)\d{2}\b/g, " ");
  s = s.replace(/'\d{2}\b/g, " ");
  // Sonderzeichen entfernen
  s = s.replace(/[^a-z0-9]+/g, "_");
  s = s.replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (s.length > 30) {
    s = s.slice(0, 30).replace(/_$/, "");
  }
  return s || "event";
}

function yymmdd(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${(y ?? "").slice(2)}${m ?? ""}${d ?? ""}`;
}

/**
 * Erzeugt einen eindeutigen, unveränderlichen Eventcode: yymmdd_kurzname.
 * Duplikate erhalten das Suffix _02, _03, ...
 */
export function buildEventcode(name: string, start: string, vorhandene: string[]): string {
  const basis = `${yymmdd(start)}_${kurzname(name)}`;
  if (!vorhandene.includes(basis)) return basis;
  let n = 2;
  while (vorhandene.includes(`${basis}_${String(n).padStart(2, "0")}`)) n += 1;
  return `${basis}_${String(n).padStart(2, "0")}`;
}

export function quartal(iso: string): "Q1" | "Q2" | "Q3" | "Q4" {
  const m = Number(iso.split("-")[1] ?? 1);
  return (["Q1", "Q1", "Q1", "Q2", "Q2", "Q2", "Q3", "Q3", "Q3", "Q4", "Q4", "Q4"][m - 1] ??
    "Q1") as "Q1" | "Q2" | "Q3" | "Q4";
}

export function jahr(iso: string): string {
  return iso.split("-")[0] ?? "";
}
