import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatDatum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aufgaben")({
  head: () => ({
    meta: [
      { title: "Aufgaben – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Alle offenen und erledigten Eventaufgaben mit Fälligkeit und Verantwortlichen.",
      },
      { property: "og:title", content: "Aufgaben – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Aufgabenliste über alle Events hinweg, sortiert nach Fälligkeit.",
      },
    ],
  }),
  component: Aufgaben,
});

function Aufgaben() {
  const { events } = useT2W();
  const heute = heuteIso();
  const [suche, setSuche] = useState("");
  const [nurOffen, setNurOffen] = useState(true);

  const zeilen = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return events
      .filter((e) => !e.archiviert)
      .flatMap((e) => e.aufgaben.map((a) => ({ ...a, event: e })))
      .filter((a) => (nurOffen ? !a.erledigt : true))
      .filter((a) =>
        q ? [a.titel, a.verantwortlich, a.event.name].join(" ").toLowerCase().includes(q) : true,
      )
      .sort((a, b) => a.faellig.localeCompare(b.faellig));
  }, [events, nurOffen, suche]);

  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Aufgaben"
        beschreibung={`${zeilen.length} Aufgaben`}
        suche={{ value: suche, onChange: setSuche, placeholder: "Aufgabe, Event, Person …" }}
        aktion={
          <button
            type="button"
            onClick={() => setNurOffen((v) => !v)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {nurOffen ? "Alle anzeigen" : "Nur offene"}
          </button>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">Fällig</th>
              <th className="px-3 py-2 font-semibold">Aufgabe</th>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold">Verantwortlich</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((a) => (
              <tr
                key={`${a.event.id}-${a.id}`}
                className="border-t border-border hover:bg-accent/50"
              >
                <td
                  className={cn(
                    "whitespace-nowrap px-3 py-2 tabular-nums",
                    !a.erledigt && a.faellig < heute ? "font-semibold text-risk-kritisch" : "",
                  )}
                >
                  {formatDatum(a.faellig)}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">{a.titel}</td>
                <td className="px-3 py-2">
                  <Link
                    to="/events/$eventcode"
                    params={{ eventcode: a.event.eventcode }}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <StatusDot status={a.event.status} />
                    {a.event.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{a.verantwortlich}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {a.erledigt ? "Erledigt" : STATUS_LABEL[a.event.status]}
                </td>
              </tr>
            ))}
            {zeilen.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                  Keine Aufgaben für diese Auswahl.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
