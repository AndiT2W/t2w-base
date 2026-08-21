import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List, Mail, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventDialog } from "@/components/t2w/EventDialog";
import { GanttSeite } from "@/routes/gantt";
import { KalenderSeite } from "@/routes/kalender";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { FolderLink } from "@/components/t2w/FolderLink";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus } from "@/lib/t2w/types";
import { jahr } from "@/lib/t2w/eventcode";

export const Route = createFileRoute("/veranstaltungen")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
    ansicht: search["ansicht"] === "kalender" || search["ansicht"] === "gantt" ? search["ansicht"] : "liste",
  }),
  head: () => ({
    meta: [
      { title: "Veranstaltungen – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Alle TIME2WIN Veranstaltungen mit Suche, Status-, Zeitraum- und Archivfiltern sowie konfigurierbaren Team-Spalten.",
      },
      { property: "og:title", content: "Veranstaltungen – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Status, Zeitraum, Verantwortliche und Risiken aller Events auf einen Blick.",
      },
    ],
  }),
  component: Veranstaltungen,
});

type Zeitraum = "alle" | "kommend" | "laufend" | "vergangen" | "monat";
type ArchivFilter = "aktiv" | "archiv" | "alle";

function Veranstaltungen() {
  const { q, ansicht } = Route.useSearch();
  const { events, settings } = useT2W();
  const navigate = useNavigate();
  const [suche, setSuche] = useState(q);
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [zeitraum, setZeitraum] = useState<Zeitraum>("alle");
  const [archiv, setArchiv] = useState<ArchivFilter>("aktiv");
  const heute = heuteIso();

  const gefiltert = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase();
    const monat = heute.slice(0, 7);
    return events
      .filter((e) =>
        archiv === "alle" ? true : archiv === "archiv" ? e.archiviert : !e.archiviert,
      )
      .filter((e) => (status === "alle" ? true : e.status === status))
      .filter((e) => {
        if (zeitraum === "alle") return true;
        if (zeitraum === "kommend") return e.start > heute;
        if (zeitraum === "vergangen") return e.ende < heute;
        if (zeitraum === "laufend") return e.start <= heute && e.ende >= heute;
        return e.start.slice(0, 7) === monat || e.ende.slice(0, 7) === monat;
      })
      .filter((e) =>
        suchbegriff
          ? [e.eventcode, e.name, e.veranstalter, e.verantwortlicher, e.ort]
              .join(" ")
              .toLowerCase()
              .includes(suchbegriff)
          : true,
      )
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, suche, status, zeitraum, archiv, heute]);

  if (ansicht === "kalender") return <KalenderSeite veranstaltungsmenue />;
  if (ansicht === "gantt") return <GanttSeite veranstaltungsmenue />;

  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Veranstaltungen"
        beschreibung={`${gefiltert.length} von ${events.length} Events`}
        suche={{
          value: suche,
          onChange: setSuche,
          placeholder: "Eventcode, Name, Veranstalter, Ort …",
        }}
        aktion={
          <EventDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                Event anlegen
              </Button>
            }
          />
        }
      />

      <div className="space-y-4">
        <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
          <AnsichtsReiter to="/veranstaltungen" aktiv label="Liste" icon={List} />
          <AnsichtsReiter to="/veranstaltungen" search={{ ansicht: "kalender" }} label="Kalender" icon={CalendarDays} />
          <AnsichtsReiter to="/veranstaltungen" search={{ ansicht: "gantt" }} label="Gantt" icon={GanttChartSquare} />
        </nav>
        <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-3">
          <Select value={status} onValueChange={(v) => setStatus(v as EventStatus | "alle")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={zeitraum} onValueChange={(v) => setZeitraum(v as Zeitraum)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Zeiträume</SelectItem>
              <SelectItem value="kommend">Kommend</SelectItem>
              <SelectItem value="laufend">Laufend</SelectItem>
              <SelectItem value="vergangen">Vergangen</SelectItem>
              <SelectItem value="monat">Aktueller Monat</SelectItem>
            </SelectContent>
          </Select>

          <Select value={archiv} onValueChange={(v) => setArchiv(v as ArchivFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Archiv" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktiv">Nur aktive</SelectItem>
              <SelectItem value="archiv">Nur archivierte</SelectItem>
              <SelectItem value="alle">Aktive & Archiv</SelectItem>
            </SelectContent>
          </Select>

        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[54rem] border-collapse text-xs">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground"><tr>
              <th className="px-2 py-1.5 font-semibold">St</th><th className="px-2 py-1.5">Event</th><th className="px-2 py-1.5">Veranstalter</th><th className="px-2 py-1.5">Zeitraum</th><th className="px-2 py-1.5 font-semibold">Tg</th><th className="px-2 py-1.5">Aufg.</th><th className="px-2 py-1.5"><span className="inline-flex gap-2" title="Outlook und SharePoint"><Mail className="size-3.5" aria-label="Outlook" /><Share2 className="size-3.5" aria-label="SharePoint" /></span></th><th className="px-2 py-1.5 text-right">Aktion</th>
            </tr></thead>
            <tbody>
              {gefiltert.map((e) => (
                <tr key={e.id} className="cursor-pointer border-t border-border hover:bg-accent/50" onClick={() => navigate({ to: "/events/$eventcode", params: { eventcode: e.eventcode } })}>
                  <td className="px-2 py-1" title={STATUS_LABEL[e.status]}><StatusDot status={e.status} /></td><td className="max-w-[16rem] truncate px-2 py-1 font-medium">{e.name}</td><td className="max-w-[10rem] truncate px-2 py-1">{e.veranstalter}</td><td className="whitespace-nowrap px-2 py-1">{formatZeitraum(e.start, e.ende)}</td><td className="px-2 py-1 tabular-nums">{Math.max(1, Math.round((new Date(e.ende).getTime() - new Date(e.start).getTime()) / 86400000) + 1)}</td><td className="px-2 py-1 tabular-nums">{e.aufgaben.filter((a) => !a.erledigt).length || "–"}</td><td className="px-2 py-1"><span className="flex gap-1"><FolderLink icon="outlook" label="Outlook" href={e.outlookOrdner ? "https://outlook.office.com/mail/" : null} available={Boolean(e.outlookOrdner)}>OL</FolderLink><FolderLink icon="sharepoint" label="SharePoint" href={(() => { const site = settings.jahresSites.find((s) => s.jahr === jahr(e.start)); return e.sharepointOrdner && site ? `${site.url.replace(/\/$/, "")}/${e.sharepointOrdner.split("/").map(encodeURIComponent).join("/")}` : null; })()} available={Boolean(e.sharepointOrdner)}>SP</FolderLink></span></td><td className="px-2 py-1 text-right"><Link to="/events/$eventcode" params={{ eventcode: e.eventcode }} className="font-medium text-primary hover:underline">Öffnen</Link></td>
                </tr>
              ))}
              {gefiltert.length === 0 && (
                <tr><td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                    Keine Events für die aktuelle Filterauswahl.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnsichtsReiter({
  to,
  search,
  label,
  icon: Icon,
  aktiv = false,
}: {
  to: "/veranstaltungen" | "/kalender" | "/gantt";
  search?: { ansicht: "kalender" | "gantt" };
  label: string;
  icon: typeof List;
  aktiv?: boolean;
}) {
  return (
    <Link
      to={to}
      search={search}
      aria-current={aktiv ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
        aktiv
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
