import { createFileRoute, Link } from "@tanstack/react-router";
import { VARIANTEN } from "@/components/t2w/VariantSwitcher";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/varianten/")({
  head: () => ({
    meta: [
      { title: "Design-Galerie – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Drei unterschiedliche UI-Varianten der TIME2WIN Event-Übersicht im direkten Vergleich.",
      },
      { property: "og:title", content: "Design-Galerie – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Ops Command Center, Timeline Planner und Event Workspace im Vergleich.",
      },
    ],
  }),
  component: Galerie,
});

const DETAILS: Record<string, string[]> = {
  basis: [
    "Tabelle mit Suche und Filterleiste",
    "Konfigurierbare Team-Spalten",
    "Kalender als eigene Ansicht",
  ],
  ops: [
    "Schmale linke Navigation, maximale Tabellenfläche",
    "KPI-Leiste: nächste Events, offene Aufgaben, Risiken, finanzielle Lücken",
    "Feste Schnellfilter, kompakte Status- und Risikoindikatoren",
  ],
  timeline: [
    "Monats- und Wochenumschaltung im Zentrum",
    "Mehrtägige Events als horizontale Balken",
    "Filter, gespeicherte Ansichten und Statuslegende links, Detail-Drawer rechts",
  ],
  workspace: [
    "Große Eventkarten statt Tabelle",
    "Nächste Aktion, Verantwortliche und Ordnerstatus je Karte",
    "Detailbereich mit Stammdaten, Kontakten, Aufgaben, Dateien, Kommunikation",
  ],
};

function Galerie() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("nav.variants")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Drei Varianten derselben Event-Übersicht mit unterschiedlicher Informationsarchitektur.
          Alle nutzen dieselben Eventdaten, Statuswerte, Eventcodes und Ordnerregeln.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {VARIANTEN.map((v) => (
          <Link
            key={v.key}
            to={v.to}
            className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                <v.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {v.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{v.kurz}</span>
              </span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground">{v.beschreibung}</p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {DETAILS[v.key]!.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
            <span className="mt-4 text-xs font-medium text-primary group-hover:underline">
              Variante öffnen →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
