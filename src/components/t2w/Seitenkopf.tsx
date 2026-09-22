import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Titel und Unterzeile der gerade offenen Seite, damit die Kopfzeile sie auf
 * schmalen Ansichten tragen kann.
 *
 * Auf dem Telefon führt das freigegebene Artboard den Seitentitel in der
 * dunklen Leiste oben statt darunter: die Brotkrume, die große Überschrift
 * und der Beschreibungstext kosteten zusammen ein Drittel der Höhe, bevor
 * die erste Zeile der Liste zu sehen war.  `PageHeader` meldet beides hier
 * an, `AppTopbar` liest es.
 *
 * Auf breiten Ansichten ändert sich nichts — dort steht der Seitenkopf
 * weiterhin unter der Leiste.
 */
type Seitenkopf = { titel: string; unterzeile: string };

const SeitenkopfContext = createContext<{
  kopf: Seitenkopf;
  melde: (kopf: Seitenkopf) => void;
}>({ kopf: { titel: "", unterzeile: "" }, melde: () => {} });

export function SeitenkopfProvider({ children }: { children: ReactNode }) {
  const [kopf, setKopf] = useState<Seitenkopf>({ titel: "", unterzeile: "" });
  const wert = useMemo(
    () => ({
      kopf,
      melde: (naechster: Seitenkopf) =>
        setKopf((bisher) =>
          bisher.titel === naechster.titel && bisher.unterzeile === naechster.unterzeile
            ? bisher
            : naechster,
        ),
    }),
    [kopf],
  );
  return <SeitenkopfContext.Provider value={wert}>{children}</SeitenkopfContext.Provider>;
}

export function useSeitenkopf() {
  return useContext(SeitenkopfContext);
}

/**
 * Wahr auf Ansichten unter `md`.  Kopfzeile und Seitenkopf teilen sich den
 * Titel: auf dem Telefon traegt ihn die Leiste, darueber der Seitenkopf.
 * Entschieden wird das im Bau, nicht mit `hidden` -- sonst stuende der Titel
 * zweimal im Baum, und eine Vorlesehilfe faende zwei Ueberschriften.
 */
export function useSchmal() {
  const [schmal, setSchmal] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const abfrage = window.matchMedia("(max-width: 767.98px)");
    const setze = () => setSchmal(abfrage.matches);
    setze();
    abfrage.addEventListener("change", setze);
    return () => abfrage.removeEventListener("change", setze);
  }, []);
  return schmal;
}
