import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventDialog } from "@/components/t2w/EventDialog";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import {
  ALL_COLUMNS,
  COLUMN_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type ColumnKey,
  type EventStatus,
} from "@/lib/t2w/types";

export const Route = createFileRoute("/veranstaltungen")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
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
  const { q } = Route.useSearch();
  const { events, spalten, setSpalten } = useT2W();
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

  const sichtbar = ALL_COLUMNS.filter((c) => spalten.includes(c));

  function toggleSpalte(c: ColumnKey) {
    setSpalten(spalten.includes(c) ? spalten.filter((x) => x !== c) : [...spalten, c]);
  }

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="size-4" />
                Spalten
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Team-Spalten</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                {ALL_COLUMNS.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${c}`}
                      checked={spalten.includes(c)}
                      onCheckedChange={() => toggleSpalte(c)}
                    />
                    <Label htmlFor={`col-${c}`} className="text-sm font-normal">
                      {COLUMN_LABEL[c]}
                    </Label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                {sichtbar.map((c) => (
                  <TableHead key={c} className={c === "status" ? "w-44" : undefined}>
                    {COLUMN_LABEL[c]}
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gefiltert.map((e) => (
                <TableRow key={e.id} className="align-middle">
                  {sichtbar.map((c) => (
                    <TableCell key={c}>
                      {c === "eventcode" && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {e.eventcode}
                        </span>
                      )}
                      {c === "name" && (
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          {e.name}
                          {e.archiviert && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                              Archiv
                            </span>
                          )}
                        </span>
                      )}
                      {c === "veranstalter" && <span className="text-sm">{e.veranstalter}</span>}
                      {c === "zeitraum" && (
                        <span className="whitespace-nowrap text-sm">
                          {formatZeitraum(e.start, e.ende)}
                        </span>
                      )}
                      {c === "verantwortlicher" && (
                        <span className="text-sm">{e.verantwortlicher}</span>
                      )}
                      {c === "status" && <StatusBadge status={e.status} />}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/events/$eventcode" params={{ eventcode: e.eventcode }}>
                        Öffnen
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {gefiltert.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={sichtbar.length + 1}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Keine Events für die aktuelle Filterauswahl.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
