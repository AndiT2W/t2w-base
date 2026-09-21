import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Die Karte der Eventdetailseiten, wie sie das freigegebene Artboard zeigt:
 * eine Überschrift, wahlweise eine Unterzeile und rechts eine Aktion.
 *
 * Die Detailreiter bestanden vorher aus wenigen sehr breiten `Card`-Blöcken
 * mit `p-6`; das Artboard teilt dieselben Inhalte in kleinere Karten und eine
 * schmale Schiene daneben.  Damit die acht Reiter nicht achtmal dasselbe
 * Kartengerüst nachbauen, steht die Form hier an einer Stelle.
 *
 * Die Überschrift ist bewusst ein `h2`: die Reiter sind gleichrangige
 * Abschnitte der Detailseite, und eine Vorlesehilfe soll sie anspringen
 * können.
 */
export function DetailKarte({
  titel,
  hinweis,
  aktion,
  className,
  inhaltKlasse,
  children,
}: {
  titel?: string;
  hinweis?: ReactNode;
  aktion?: ReactNode;
  className?: string;
  inhaltKlasse?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4 text-card-foreground", className)}
    >
      {(titel || aktion) && (
        <div className="mb-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {titel && <h2 className="text-sm font-bold leading-tight">{titel}</h2>}
            {hinweis && <p className="mt-0.5 text-xs text-muted-foreground">{hinweis}</p>}
          </div>
          {aktion}
        </div>
      )}
      <div className={inhaltKlasse}>{children}</div>
    </section>
  );
}

/**
 * Ein Feld mit der Beschriftung darüber statt daneben.
 *
 * Die Detailreiter setzten die Beschriftung links in eine feste `9rem`-Spalte.
 * Das Artboard stellt sie über das Eingabefeld, wodurch zwei Felder
 * nebeneinander in dieselbe Kartenbreite passen.
 *
 * Ohne `htmlFor` gibt es kein Ziel für ein `label`, deshalb wird die
 * Beschriftung dann als `span` gezeichnet; das zugehörige Bedienelement (etwa
 * eine Auswahl) trägt in dem Fall sein eigenes `aria-label`.
 */
export function Feld({
  label,
  hinweis,
  htmlFor,
  className,
  children,
}: {
  label: ReactNode;
  hinweis?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  const text = (
    <>
      {label}
      {hinweis && <span className="ml-1 font-normal text-muted-foreground">{hinweis}</span>}
    </>
  );
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      {htmlFor ? (
        <Label htmlFor={htmlFor} className="text-xs font-semibold">
          {text}
        </Label>
      ) : (
        <span className="text-xs font-semibold leading-none">{text}</span>
      )}
      {children}
    </div>
  );
}

/**
 * Das zweispaltige Gerüst eines Detailreiters: Arbeitsfläche links, schmale
 * Schiene rechts.  Die Schiene ist im Artboard 330 px breit und trägt die
 * Karten, die neben der eigentlichen Arbeit stehen — Notizen, Ordner,
 * Aufgaben, Gefahrenbereich.
 *
 * Unter `lg` stehen beide Spalten untereinander, die Schiene also unter der
 * Arbeitsfläche.
 */
export function DetailRaster({ schiene, children }: { schiene: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_20.625rem]">
      <div className="min-w-0 space-y-3">{children}</div>
      <div className="space-y-3">{schiene}</div>
    </div>
  );
}
