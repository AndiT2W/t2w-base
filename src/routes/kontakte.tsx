import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/t2w/PageHeader";
import { useT2W } from "@/lib/t2w/store";

export const Route = createFileRoute("/kontakte")({
  head: () => ({
    meta: [
      { title: "Kontakte – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Alle Eventkontakte mit Rolle, E-Mail, Telefon und zugehörigem Event.",
      },
      { property: "og:title", content: "Kontakte – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Ansprechpartner aller Veranstaltungen zentral durchsuchen.",
      },
    ],
  }),
  component: Kontakte,
});

function Kontakte() {
  const { events } = useT2W();
  const [suche, setSuche] = useState("");

  const zeilen = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return events
      .flatMap((e) => e.kontakte.map((k) => ({ ...k, event: e })))
      .filter((k) =>
        q
          ? [k.name, k.rolle, k.email, k.telefon, k.event.name, k.event.veranstalter]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [events, suche]);

  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Kontakte"
        beschreibung={`${zeilen.length} Ansprechpartner`}
        suche={{ value: suche, onChange: setSuche, placeholder: "Name, Rolle, Event …" }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {zeilen.map((k) => (
          <div
            key={`${k.event.id}-${k.id}`}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="font-medium text-foreground">{k.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.rolle}</p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-muted-foreground">E-Mail</dt>
                <dd className="truncate">{k.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-muted-foreground">Telefon</dt>
                <dd>{k.telefon}</dd>
              </div>
            </dl>
            <Link
              to="/events/$eventcode"
              params={{ eventcode: k.event.eventcode }}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {k.event.name}
            </Link>
          </div>
        ))}
        {zeilen.length === 0 && (
          <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Keine Kontakte gefunden.
          </p>
        )}
      </div>
    </div>
  );
}
