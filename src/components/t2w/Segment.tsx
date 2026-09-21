import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ein Segment für die ganze Anwendung: zwei oder drei Ansichten derselben
 * Daten, von denen genau eine an ist.
 *
 * Die Leiste stand früher viermal im Code und sah viermal anders aus; seit der
 * Vereinheitlichung kommt die Form hier aus einer Stelle. Der Stil folgt seit
 * 22.09.2026 dem freigegebenen Artboard: Unterkante am Balken, grüner
 * Unterstrich am aktiven Feld statt einer eigenen Fläche.
 *
 * Die Fläche allein trägt die Aussage nie, deshalb setzt jede Aufrufstelle
 * zusätzlich `aria-current` (Links) oder `aria-pressed` (Schaltflächen).
 *
 * Die Felder bleiben bei den Aufrufstellen, weil die einen Links sind (Zurück,
 * Lesezeichen, neuer Tab) und die anderen Schaltflächen; geteilt ist die Form.
 */
export function Segment({
  label,
  als = "gruppe",
  className,
  children,
}: {
  label: string;
  als?: "nav" | "gruppe";
  className?: string;
  children: ReactNode;
}) {
  const klasse = cn("inline-flex w-fit items-center gap-0.5 border-b border-border", className);
  return als === "nav" ? (
    <nav aria-label={label} className={klasse}>
      {children}
    </nav>
  ) : (
    <div role="group" aria-label={label} className={klasse}>
      {children}
    </div>
  );
}

/**
 * Die Form eines Feldes im Segment.  `min-h-11` ist die Fingerkuppe auf dem
 * Telefon, ab `md` reicht die kompakte Höhe.
 *
 * Die Schriftstärke bleibt bei Aktiv/Inaktiv gleich (`font-medium`), anders
 * als im Artboard (700/500): fetterer Text ist breiter und ließ die Leiste
 * beim Umschalten früher ruckeln — nur Farbe und Unterstrich tragen den
 * Zustand.
 */
export function segmentFeld(aktiv: boolean, className?: string) {
  return cn(
    "relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 px-3.5 text-sm font-medium transition-colors md:min-h-8",
    aktiv
      ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2.5px] after:rounded-full after:bg-primary after:content-['']"
      : "text-muted-foreground hover:text-foreground",
    className,
  );
}
