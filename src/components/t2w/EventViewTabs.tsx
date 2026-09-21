import { Link } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Liste, Kalender und Gantt zeigen dieselben Events in drei Formen.  Die
 * Leiste dafür stand dreimal im Code — in `veranstaltungen.tsx` als Segment
 * auf Kartengrund, in `kalender.tsx` und `gantt.tsx` je als Reiterzeile mit
 * Unterkante.  Drei Bauweisen für eine Leiste, die überall dasselbe tut.
 *
 * Die Ansichten bleiben Links: Zurück, Lesezeichen und „in neuem Tab öffnen“
 * sollen weiter funktionieren.  Die aktive Ansicht trägt `aria-current`, nicht
 * nur eine andere Farbe.
 */
export type EventAnsicht = "liste" | "kalender" | "gantt";

const ANSICHTEN = [
  { key: "liste", label: "Liste", icon: List },
  { key: "kalender", label: "Kalender", icon: CalendarDays },
  { key: "gantt", label: "Gantt", icon: GanttChartSquare },
] as const;

export function EventViewTabs({ aktiv }: { aktiv: EventAnsicht }) {
  return (
    <nav
      aria-label="Veranstaltungsansichten"
      className="flex w-fit gap-1 rounded-lg border border-border bg-card p-1"
    >
      {ANSICHTEN.map((ansicht) => {
        const an = ansicht.key === aktiv;
        return (
          <Link
            key={ansicht.key}
            to="/veranstaltungen"
            search={(alt: { q?: string }) => ({ q: alt.q ?? "", ansicht: ansicht.key })}
            {...(an ? { "aria-current": "page" as const } : {})}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:min-h-8",
              an
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <ansicht.icon className="size-4" />
            {ansicht.label}
          </Link>
        );
      })}
    </nav>
  );
}
