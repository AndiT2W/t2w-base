import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";

export const Route = createFileRoute("/gantt")({
  head: () => ({ meta: [{ title: "Gantt – TIME2WIN Eventverwaltung" }] }),
  component: GanttSeite,
});

function GanttSeite() {
  const { events } = useT2W();
  const heute = heuteIso();
  const sichtbar = events.filter((event) => !event.archiviert).sort((a, b) => a.start.localeCompare(b.start));
  const min = Math.min(...sichtbar.map((event) => Date.parse(`${event.start}T00:00:00`)), Date.parse(`${heute}T00:00:00`));
  const max = Math.max(...sichtbar.map((event) => Date.parse(`${event.ende}T00:00:00`)), min + 30 * 86400000);
  const breite = Math.max(max - min, 30 * 86400000);

  return (
    <div>
      <PageHeader krumen={[{ label: "TIME2WIN", to: "/" }]} titel="Veranstaltungen" beschreibung={`${sichtbar.length} aktive Events`} />
      <div className="space-y-4">
        <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
          <Reiter to="/veranstaltungen" label="Liste" icon={List} />
          <Reiter to="/kalender" label="Kalender" icon={CalendarDays} />
          <Reiter to="/gantt" label="Gantt" icon={GanttChartSquare} aktiv />
        </nav>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface p-3">
          <div className="min-w-[48rem] space-y-2">
            {sichtbar.map((event) => {
              const left = ((Date.parse(`${event.start}T00:00:00`) - min) / breite) * 100;
              const width = Math.max(((Date.parse(`${event.ende}T00:00:00`) - Date.parse(`${event.start}T00:00:00`) + 86400000) / breite) * 100, 1.5);
              return <div key={event.id} className="grid grid-cols-[13rem_1fr] items-center gap-3 text-xs">
                <Link to="/events/$eventcode" params={{ eventcode: event.eventcode }} className="truncate font-medium hover:text-primary">{event.name}</Link>
                <div className="relative h-8 rounded bg-secondary"><Link to="/events/$eventcode" params={{ eventcode: event.eventcode }} className="absolute top-1.5 h-5 rounded bg-primary/80 px-2 text-[11px] text-primary-foreground" style={{ left: `${left}%`, width: `${width}%` }} title={formatZeitraum(event.start, event.ende)}><StatusBadge status={event.status} /></Link></div>
              </div>;
            })}
            {sichtbar.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Keine aktiven Events.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Reiter({ to, label, icon: Icon, aktiv = false }: { to: "/veranstaltungen" | "/kalender" | "/gantt"; label: string; icon: typeof List; aktiv?: boolean }) {
  return <Link to={to} aria-current={aktiv ? "page" : undefined} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${aktiv ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}><Icon className="size-4" />{label}</Link>;
}
