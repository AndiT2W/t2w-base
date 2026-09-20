import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum } from "@/lib/t2w/format";
import { STATUS_LABEL, type T2WEvent } from "@/lib/t2w/types";
import { openOfferEvents } from "@/lib/t2w/event-projections";
import { OrganizerLink } from "@/components/t2w/OrganizerLink";
import { DataTable, SortHeader, useTableSort } from "@/components/t2w/DataTable";

const SPALTEN = [
  { key: "Eventcode", sortValue: (event: T2WEvent) => event.eventcode },
  { key: "Event", sortValue: (event: T2WEvent) => event.name },
  { key: "Veranstalter", sortValue: (event: T2WEvent) => event.veranstalter },
  { key: "Zeitraum", sortValue: (event: T2WEvent) => event.start },
  { key: "Status", sortValue: (event: T2WEvent) => STATUS_LABEL[event.status] },
] as const;
type Spalte = (typeof SPALTEN)[number]["key"];

export const Route = createFileRoute("/angebote")({
  head: () => ({
    meta: [
      { title: "Angebote – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Angebotsmodul der TIME2WIN Eventverwaltung: offene Angebote je Event.",
      },
      { property: "og:title", content: "Angebote – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Welche Events noch ein Angebot oder eine Bestätigung brauchen.",
      },
    ],
  }),
  component: Angebote,
});

function Angebote() {
  const { events } = useT2W();
  const offen = openOfferEvents(events);
  const tabelle = useTableSort<T2WEvent, Spalte>(SPALTEN, {
    key: "Zeitraum",
    direction: "asc",
  });
  const zeilen = tabelle.rows(offen);

  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Angebote"
        beschreibung="Modul in Vorbereitung · abgeleitet aus unbestätigten Events"
      />

      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <FileText className="mt-0.5 size-4 shrink-0" />
          <p>
            Das Angebotsmodul ist noch nicht implementiert. Bis dahin zeigt diese Ansicht alle
            Events ohne Zusage – sie benötigen ein Angebot oder eine Bestätigung.
          </p>
        </div>

        <DataTable exportName="Angebote" className="min-w-[40rem] border-collapse text-sm">
          <thead className="t2w-table-header text-left">
            <tr>
              {SPALTEN.map((spalte) => (
                <th key={spalte.key} className="px-3 py-2">
                  <SortHeader
                    label={spalte.key}
                    active={tabelle.sort.key === spalte.key}
                    direction={tabelle.sort.direction}
                    onSort={() => tabelle.sortBy(spalte.key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((e) => (
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
                <td className="px-3 py-2">
                  <OrganizerLink organizerId={e.veranstalterId} name={e.veranstalter} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">{formatZeitraum(e.start, e.ende)}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <StatusDot status={e.status} />
                    {STATUS_LABEL[e.status]}
                  </span>
                </td>
              </tr>
            ))}
            {offen.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                  Keine offenen Angebote.
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
