import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL } from "@/lib/t2w/types";
import { invoiceReadyEvents } from "@/lib/t2w/event-projections";

export const Route = createFileRoute("/rechnungen")({
  head: () => ({
    meta: [
      { title: "Rechnungen – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Rechnungsmodul der TIME2WIN Eventverwaltung: abrechnungsreife Events.",
      },
      { property: "og:title", content: "Rechnungen – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Durchgeführte Events, die abgerechnet werden müssen.",
      },
    ],
  }),
  component: Rechnungen,
});

function Rechnungen() {
  const { events } = useT2W();
  const heute = heuteIso();
  const faellig = invoiceReadyEvents(events, heute);

  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Rechnungen"
        beschreibung="Modul in Vorbereitung · abgeleitet aus durchgeführten Events"
      />

      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <Receipt className="mt-0.5 size-4 shrink-0" />
          <p>
            Das Rechnungsmodul ist noch nicht implementiert. Diese Ansicht listet alle bereits
            durchgeführten Events, die abgerechnet werden müssen.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Eventcode</th>
                <th className="px-3 py-2 font-semibold">Event</th>
                <th className="px-3 py-2 font-semibold">Veranstalter</th>
                <th className="px-3 py-2 font-semibold">Zeitraum</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {faellig.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-accent/50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                    {e.eventcode}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to="/events/$eventcode"
                      params={{ eventcode: e.eventcode }}
                      className="font-medium text-primary hover:underline"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{e.veranstalter}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatZeitraum(e.start, e.ende)}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <StatusDot status={e.status} />
                      {STATUS_LABEL[e.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {faellig.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                    Keine abrechnungsreifen Events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
