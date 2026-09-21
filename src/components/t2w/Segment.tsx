import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ein Segment für die ganze Anwendung: zwei oder drei Ansichten derselben
 * Daten, von denen genau eine an ist.
 *
 * Die Leiste stand viermal im Code und sah viermal anders aus — weiße Schiene
 * mit grauem Feld in `EventViewTabs` und im Kommunikationsreiter, graue
 * Schiene mit weißem Feld in `aufgaben.tsx` und in `ui/tabs`.  Dieselbe
 * Bedienung, vier Erscheinungen; auf der Veranstaltungsseite fiel es am
 * meisten auf, weil dort Liste, Kalender und Gantt nebeneinander stehen.
 *
 * Gewählt ist die graue Schiene mit erhabenem weißem Feld: der Seitengrund ist
 * fast weiß, eine weiße Schiene darauf hängt allein am Rahmen, und das aktive
 * Feld müsste dann dunkler sein als seine Nachbarn — genau verkehrt herum.
 *
 * Das aktive Feld wechselt die Fläche, nicht die Schriftstärke: fette Schrift
 * ist breiter, das Segment ruckelte beim Umschalten.  Die Fläche allein trägt
 * die Aussage nicht, deshalb setzt jede Aufrufstelle zusätzlich `aria-current`
 * (Links) oder `aria-pressed` (Schaltflächen).
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
  const klasse = cn(
    "inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-muted p-1",
    className,
  );
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
 */
export function segmentFeld(aktiv: boolean, className?: string) {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:min-h-8",
    aktiv ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
    className,
  );
}
