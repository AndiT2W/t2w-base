import { CalendarRange } from "lucide-react";
import type { EventDateCollision } from "@/lib/t2w/event-date-collisions";

const DATE_COLLISION_STYLES = [
  {
    table:
      "!bg-chart-2/10 hover:!bg-chart-2/15 [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-chart-2",
    card: "border-l-[3px] border-l-chart-2 bg-chart-2/10",
    badge: "border-chart-2/40 bg-chart-2/15",
  },
  {
    table:
      "!bg-chart-3/10 hover:!bg-chart-3/15 [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-chart-3",
    card: "border-l-[3px] border-l-chart-3 bg-chart-3/10",
    badge: "border-chart-3/40 bg-chart-3/15",
  },
  {
    table:
      "!bg-chart-4/10 hover:!bg-chart-4/15 [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-chart-4",
    card: "border-l-[3px] border-l-chart-4 bg-chart-4/10",
    badge: "border-chart-4/40 bg-chart-4/15",
  },
  {
    table:
      "!bg-chart-1/10 hover:!bg-chart-1/15 [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-chart-1",
    card: "border-l-[3px] border-l-chart-1 bg-chart-1/10",
    badge: "border-chart-1/40 bg-chart-1/15",
  },
  {
    table:
      "!bg-chart-5/10 hover:!bg-chart-5/15 [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-chart-5",
    card: "border-l-[3px] border-l-chart-5 bg-chart-5/10",
    badge: "border-chart-5/40 bg-chart-5/15",
  },
] as const;

function styleFor(collision: EventDateCollision) {
  return DATE_COLLISION_STYLES[collision.groupIndex % DATE_COLLISION_STYLES.length];
}

export function eventDateCollisionSurfaceClass(
  collision: EventDateCollision | undefined,
  surface: "table" | "card",
): string | undefined {
  return collision ? styleFor(collision)?.[surface] : undefined;
}

export function EventDateCollisionIndicator({ collision }: { collision: EventDateCollision }) {
  const peers = collision.peerNames.join(", ");
  const label = `Terminkollision: ${collision.eventCount} Events mit überschneidenden Veranstaltungstagen. Weitere Events in der Gruppe: ${peers}.`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-none text-foreground ${styleFor(collision)?.badge}`}
      aria-label={label}
      title={label}
      data-date-collision-count={collision.eventCount}
    >
      <CalendarRange className="size-3" aria-hidden="true" />
      {collision.eventCount}×
    </span>
  );
}

export function EventDateCollisionLegend() {
  return (
    <p
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      aria-label="Legende für Terminkollisionen"
    >
      <CalendarRange className="size-3.5" aria-hidden="true" />
      Gleiche Farbe = überschneidende Veranstaltungstage · 2×/3× = Events in der Gruppe
    </p>
  );
}
