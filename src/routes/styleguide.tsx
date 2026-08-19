import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/t2w/PageHeader";
import { RiskIndicator, StatusBadge } from "@/components/t2w/StatusBadge";
import { STATUS_ORDER } from "@/lib/t2w/types";

export const Route = createFileRoute("/styleguide")({
  head: () => ({
    meta: [
      { title: "Styleguide – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Verbindliche TIME2WIN Designrichtlinie: permanente linke App-Navigation, dichter Arbeitsbereich rechts, Status- und Risikofarben.",
      },
      { property: "og:title", content: "Styleguide – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Layoutregeln, Navigationsmuster und Farbsystem für alle TIME2WIN Module.",
      },
    ],
  }),
  component: Styleguide,
});

const REGELN = [
  "Permanente linke Sidebar ist die einzige Hauptnavigation – keine horizontale Hauptmenüleiste.",
  "Menüpunkte vertikal gruppiert: Übersicht, Veranstaltungen, Aufgaben, Kontakte, Angebote, Rechnungen, Einstellungen.",
  "Der aktive Menüpunkt erhält eine dezent hinterlegte Fläche und klaren Kontrast in der Schriftfarbe.",
  "Alle Inhalte, Filter, Tabellen und Detailseiten liegen im rechten Hauptbereich.",
  "Der Kopfbereich enthält ausschließlich Breadcrumb/Kontext, Seitentitel, globale Suche und die primäre Aktion.",
  "Standardansicht ist das Ops Command Center: KPI-Leiste plus dichte Eventtabelle.",
  "Unter 1024 px wird die Sidebar zu einem Drawer, der über das Menüsymbol geöffnet wird.",
  "Farben ausschließlich über semantische Tokens (nav, surface, status-*, risk-*) – keine harten Farbwerte.",
  "Sprache durchgehend Deutsch, ruhiger und sachlicher Ton.",
  "Kein Gantt-Diagramm.",
];

const TOKENS = [
  { name: "nav", klasse: "bg-nav", text: "Navigationsfläche" },
  { name: "nav-active", klasse: "bg-nav-active", text: "Aktiver Menüpunkt" },
  { name: "surface", klasse: "bg-surface", text: "Arbeitsfläche / Karten" },
  { name: "background", klasse: "bg-background", text: "Seitenhintergrund" },
  { name: "primary", klasse: "bg-primary", text: "Primäraktion" },
  { name: "accent", klasse: "bg-accent", text: "Hover / Hervorhebung" },
];

function Styleguide() {
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Styleguide"
        beschreibung="Verbindliche Designrichtlinie für alle TIME2WIN Module"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Layout- und Navigationsregeln
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {REGELN.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Seitenaufbau
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-md bg-secondary p-3 text-xs leading-relaxed text-foreground">
              {`┌───────────┬──────────────────────────────────────┐
│ Sidebar   │ Breadcrumb · Titel · Suche · Aktion  │
│ (fix,     ├──────────────────────────────────────┤
│  dunkel)  │ KPI-Leiste                           │
│           │ Filter                               │
│           │ Dichte Tabelle / Detailbereich       │
└───────────┴──────────────────────────────────────┘`}
            </pre>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Farbtokens
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TOKENS.map((t) => (
                <div key={t.name} className="flex items-center gap-2 text-sm">
                  <span className={`size-6 shrink-0 rounded border border-border ${t.klasse}`} />
                  <span className="font-mono text-xs">{t.name}</span>
                  <span className="truncate text-muted-foreground">{t.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status und Risiko
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <RiskIndicator risiko="keins" />
              <RiskIndicator risiko="beobachten" />
              <RiskIndicator risiko="kritisch" />
            </div>
          </section>

          <p className="text-sm text-muted-foreground">
            Zum Vergleich der früheren Entwürfe:{" "}
            <Link to="/varianten" className="font-medium text-primary hover:underline">
              Design-Varianten
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
