/**
 * Die Symbolbibliothek: hochgeladene Symbole neben dem festen Satz.
 *
 * Ein `icon` trägt zwei Formen.  Ein blanker Name wie `radio` meint ein
 * Symbol aus dem festen Satz in `ServiceBadge.tsx`; `upload:<uuid>` meint ein
 * hochgeladenes.  Die zweite Form ist am Präfix erkennbar und kollidiert
 * damit nie mit einem Namen aus dem Satz -- Migration 0038 hat blanke Namen
 * geschrieben, die so gültig bleiben.
 */

export type Symbolakte = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /**
   * Nur einfarbige Dateien nehmen die gewählte Farbe an.  Eine mehrfarbige
   * Grafik einzufärben zerstörte sie; die Oberfläche sagt das, statt es still
   * zu tun.
   */
  monochrome: boolean;
  active: boolean;
  createdAt: string;
};

const PRAEFIX = "upload:";

export const istHochgeladen = (icon?: string | null) => !!icon?.startsWith(PRAEFIX);
export const symbolkennung = (icon: string) => icon.slice(PRAEFIX.length);
export const symbolWert = (id: string) => `${PRAEFIX}${id}`;
/**
 * Der Inhalt kommt über einen eigenen Aufruf, nicht als base64 in der
 * Stammdatenantwort: ein Symbol steht in jeder Tabellenzeile, und der Dienst
 * liefert es mit ETag und einem Jahr Cache-Zeit aus.
 */
export const symbolQuelle = (id: string) => `/api/v1/icons/${id}`;

export async function apiSymbole(mitArchivierten = false) {
  const antwort = await fetch(`/api/v1/icons${mitArchivierten ? "?includeArchived=true" : ""}`, {
    credentials: "include",
  });
  if (!antwort.ok) throw new Error("Symbole konnten nicht geladen werden.");
  return (await antwort.json()) as Symbolakte[];
}

/** Die Datei als base64 ohne den `data:`-Kopf — derselbe Vertrag wie bei Aufgabenanhängen. */
function alsBase64(datei: File) {
  return new Promise<string>((erfuellen, ablehnen) => {
    const leser = new FileReader();
    leser.onerror = () => ablehnen(new Error("Die Datei konnte nicht gelesen werden."));
    leser.onload = () => {
      const wert = String(leser.result ?? "");
      erfuellen(wert.slice(wert.indexOf(",") + 1));
    };
    leser.readAsDataURL(datei);
  });
}

export async function apiSymbolHochladen(datei: File) {
  const antwort = await fetch("/api/v1/icons", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: datei.name,
      mimeType: datei.type,
      contentBase64: await alsBase64(datei),
    }),
  });
  if (!antwort.ok) {
    // Der Dienst nennt den Grund — zu groß, nicht quadratisch, verbotenes
    // Element im SVG.  Den Grund weiterzureichen ist der ganze Sinn der
    // Ablehnung: still bereinigen zerstört ein Symbol, ohne dass es jemand
    // erfährt.
    const fehler = (await antwort.json().catch(() => null)) as { message?: string } | null;
    throw new Error(fehler?.message ?? "Das Symbol konnte nicht hochgeladen werden.");
  }
  return (await antwort.json()) as Symbolakte;
}

export async function apiSymbolArchivieren(id: string, active: boolean) {
  const antwort = await fetch(`/api/v1/icons/${id}/archive`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  if (!antwort.ok) throw new Error("Das Symbol konnte nicht archiviert werden.");
  return (await antwort.json()) as Symbolakte;
}
