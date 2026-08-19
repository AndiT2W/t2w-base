import { Link } from "@tanstack/react-router";
import { Gauge, LayoutGrid, LayoutList, CalendarRange } from "lucide-react";

export const VARIANTEN = [
  {
    to: "/veranstaltungen",
    key: "basis",
    label: "Basis · klassische Liste",
    kurz: "Klassische Liste",
    beschreibung: "Klassische Eventliste mit Filterleiste und konfigurierbaren Team-Spalten.",
    icon: LayoutList,
  },
  {
    to: "/varianten/ops",
    key: "ops",
    label: "Variante 1 · Ops Command Center",
    kurz: "Dichte Sachbearbeitung (Standard)",
    beschreibung:
      "Verbindliches Hauptdesign: permanente linke Sidebar, KPI-Leiste und sehr dichte Tabelle. Live unter Übersicht.",
    icon: Gauge,
  },
  {
    to: "/varianten/timeline",
    key: "timeline",
    label: "Variante 2 · Timeline Planner",
    kurz: "Planungsorientiert",
    beschreibung:
      "Kalender im Zentrum, Filter und gespeicherte Ansichten links, Detail-Drawer rechts.",
    icon: CalendarRange,
  },
  {
    to: "/varianten/workspace",
    key: "workspace",
    label: "Variante 3 · Event Workspace",
    kurz: "Event- und kundenzentriert",
    beschreibung:
      "Großzügige Eventkarten mit nächster Aktion und Ordnerstatus, Detailbereich mit fünf Tabs.",
    icon: LayoutGrid,
  },
] as const;

export type VariantKey = (typeof VARIANTEN)[number]["key"];

export function VariantSwitcher({ aktiv }: { aktiv: VariantKey }) {
  const current = VARIANTEN.find((v) => v.key === aktiv)!;
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Design-Variante
        </span>
        <div className="flex flex-wrap gap-1">
          {VARIANTEN.map((v) => (
            <Link
              key={v.key}
              to={v.to}
              className={
                v.key === aktiv
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              }
            >
              {v.label}
            </Link>
          ))}
          <Link
            to="/varianten"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Galerie
          </Link>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{current.kurz}:</span> {current.beschreibung}
      </p>
    </div>
  );
}
