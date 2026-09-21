import { Link } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List } from "lucide-react";
import { Segment, segmentFeld } from "@/components/t2w/Segment";

/**
 * Liste, Kalender und Gantt zeigen dieselben Events in drei Formen.  Die
 * Leiste dafür stand dreimal im Code — in `veranstaltungen.tsx` als Segment
 * auf Kartengrund, in `kalender.tsx` und `gantt.tsx` je als Reiterzeile mit
 * Unterkante.  Drei Bauweisen für eine Leiste, die überall dasselbe tut.
 *
 * Die Form kommt jetzt aus `Segment`, damit sie mit den übrigen Ansichts-
 * leisten der Anwendung übereinstimmt.
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
    <Segment als="nav" label="Veranstaltungsansichten">
      {ANSICHTEN.map((ansicht) => {
        const an = ansicht.key === aktiv;
        return (
          <Link
            key={ansicht.key}
            to="/veranstaltungen"
            search={(alt: { q?: string }) => ({ q: alt.q ?? "", ansicht: ansicht.key })}
            {...(an ? { "aria-current": "page" as const } : {})}
            className={segmentFeld(an)}
          >
            <ansicht.icon className="size-4" />
            {ansicht.label}
          </Link>
        );
      })}
    </Segment>
  );
}
