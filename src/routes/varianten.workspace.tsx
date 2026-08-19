import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, FolderCheck, FolderX, MapPin, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantSwitcher } from "@/components/t2w/VariantSwitcher";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { naechsteAufgabe } from "@/lib/t2w/kalender";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/varianten/workspace")({
  head: () => ({
    meta: [
      { title: "Event Workspace – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Eventzentrierte Arbeitsbereiche mit Karten, nächster Aktion, Ordnerstatus und Detail-Tabs.",
      },
      { property: "og:title", content: "Event Workspace – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Variante 3: großzügige Eventkarten statt Tabelle, kunden- und eventzentriert.",
      },
    ],
  }),
  component: WorkspaceVariante,
});

function WorkspaceVariante() {
  const { events } = useT2W();
  const heute = heuteIso();
  const [suche, setSuche] = useState("");
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [offenId, setOffenId] = useState<string | null>(null);

  const karten = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return events
      .filter((e) => !e.archiviert)
      .filter((e) => (status === "alle" ? true : e.status === status))
      .filter((e) =>
        q
          ? [e.eventcode, e.name, e.veranstalter, e.verantwortlicher, e.ort]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, suche, status]);

  const offen = karten.find((e) => e.id === offenId) ?? null;

  return (
    <div className="space-y-5">
      <VariantSwitcher aktiv="workspace" />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Event Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {karten.length} aktive Events · jede Karte zeigt nächste Aktion und Ordnerstatus.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Event oder Kunde suchen …"
            aria-label="Events durchsuchen"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["alle", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "alle" ? "Alle Status" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {karten.map((e) => (
          <Karte
            key={e.id}
            event={e}
            heute={heute}
            offen={offenId === e.id}
            onToggle={() => setOffenId(offenId === e.id ? null : e.id)}
          />
        ))}
        {karten.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
            Keine Events für diese Auswahl.
          </p>
        )}
      </div>

      {offen && <Detailbereich event={offen} />}
    </div>
  );
}

function Karte({
  event,
  heute,
  offen,
  onToggle,
}: {
  event: T2WEvent;
  heute: string;
  offen: boolean;
  onToggle: () => void;
}) {
  const naechste = naechsteAufgabe(event);
  const ueberfaellig = naechste ? naechste.faellig < heute : false;
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-surface p-5 transition-colors",
        offen ? "border-primary" : "border-border hover:border-primary/50",
      )}
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {event.name}
          </h2>
          <p className="truncate font-mono text-xs text-muted-foreground">{event.eventcode}</p>
        </div>
        <StatusBadge status={event.status} />
      </header>

      <dl className="grid gap-2 text-sm">
        <Fakt icon={CalendarDays} label="Zeitraum" wert={formatZeitraum(event.start, event.ende)} />
        <Fakt icon={MapPin} label="Veranstalter" wert={`${event.veranstalter} · ${event.ort}`} />
        <Fakt icon={User} label="Verantwortlich" wert={event.verantwortlicher} />
      </dl>

      <div className="rounded-lg bg-secondary px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Nächste Aktion
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-medium",
            ueberfaellig ? "text-risk-kritisch" : "text-foreground",
          )}
        >
          {naechste
            ? `${naechste.titel} · fällig ${formatDatum(naechste.faellig)}`
            : "Keine offene Aufgabe"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Ordner ok={Boolean(event.outlookOrdner)} text="Outlook" />
        <Ordner ok={Boolean(event.sharepointOrdner)} text="SharePoint" />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant={offen ? "secondary" : "default"} size="sm" onClick={onToggle}>
          {offen ? "Arbeitsbereich schließen" : "Arbeitsbereich öffnen"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/events/$eventcode" params={{ eventcode: event.eventcode }}>
            Vollansicht
          </Link>
        </Button>
      </div>
    </article>
  );
}

function Fakt({
  icon: Icon,
  label,
  wert,
}: {
  icon: typeof CalendarDays;
  label: string;
  wert: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <dt className="sr-only">{label}</dt>
      <dd className="truncate text-sm text-foreground">{wert}</dd>
    </div>
  );
}

function Ordner({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? FolderCheck : FolderX;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium",
        ok ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {text}: {ok ? "verknüpft" : "offen"}
    </span>
  );
}

function Detailbereich({ event }: { event: T2WEvent }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Arbeitsbereich · {event.name}
      </h2>
      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{event.eventcode}</p>

      <Tabs defaultValue="stammdaten" className="mt-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
          <TabsTrigger value="kontakte">Kontakte</TabsTrigger>
          <TabsTrigger value="aufgaben">Aufgaben</TabsTrigger>
          <TabsTrigger value="dateien">Dateien</TabsTrigger>
          <TabsTrigger value="kommunikation">Kommunikation</TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten" className="mt-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Feld label="Zeitraum" wert={formatZeitraum(event.start, event.ende)} />
            <Feld label="Veranstalter" wert={event.veranstalter} />
            <Feld label="Ort" wert={event.ort} />
            <Feld label="Verantwortlich" wert={event.verantwortlicher} />
            <Feld label="Teilnehmer" wert={String(event.teilnehmer)} />
            <Feld label="Status" wert={STATUS_LABEL[event.status]} />
            <Feld
              label="Outlook-Ordner (Quartal)"
              wert={event.outlookOrdner ?? "nicht verknüpft"}
            />
            <Feld
              label="SharePoint-Ordner (Jahresbereich)"
              wert={event.sharepointOrdner ?? "nicht verknüpft"}
            />
            <div className="sm:col-span-2">
              <Feld label="Notizen" wert={event.notizen || "—"} />
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="kontakte" className="mt-4 space-y-2">
          {event.kontakte.length === 0 && <Leer text="Keine Kontakte hinterlegt." />}
          {event.kontakte.map((k) => (
            <div key={k.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium text-foreground">
                {k.name} <span className="text-muted-foreground">· {k.rolle}</span>
              </p>
              <p className="text-muted-foreground">
                {k.email} · {k.telefon}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="aufgaben" className="mt-4 space-y-2">
          {event.aufgaben.length === 0 && <Leer text="Keine Aufgaben hinterlegt." />}
          {event.aufgaben.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <span
                className={cn(
                  "min-w-0 truncate",
                  a.erledigt && "text-muted-foreground line-through",
                )}
              >
                {a.titel} · {a.verantwortlich}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDatum(a.faellig)}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="dateien" className="mt-4 space-y-2">
          {event.dateien.length === 0 && <Leer text="Keine Dateien verknüpft." />}
          {event.dateien.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <span className="min-w-0 truncate text-foreground">{d.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {d.groesse} · {formatDatum(d.aktualisiert)}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="kommunikation" className="mt-4 space-y-2">
          {event.kommunikation.length === 0 && <Leer text="Keine Kommunikation erfasst." />}
          {event.kommunikation.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium text-foreground">
                {m.betreff}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · {m.kanal} · {formatDatum(m.datum)} · {m.autor}
                </span>
              </p>
              <p className="mt-1 text-muted-foreground">{m.text}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Feld({ label, wert }: { label: string; wert: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">{wert}</dd>
    </div>
  );
}

function Leer({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
