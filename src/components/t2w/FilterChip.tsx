import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Ein Filter als Chip.  Die Auswahl bleibt ein natives select: es bringt
 * Tastaturbedienung, Bildschirmleser und die Mobilauswahl des Systems mit,
 * ein nachgebautes Menü müsste das alles erst wieder herstellen.
 *
 * Gemeinsame Bildsprache von Aufgaben, Kommunikation und Veranstaltungen:
 * gesetzte Filter tragen den Markenakzent, ungesetzte bleiben neutral.
 */
export function FilterChip({
  label,
  ariaLabel,
  value,
  inaktiv,
  onChange,
  children,
}: {
  label: string;
  /** Abweichender barrierefreier Name, wenn die sichtbare Beschriftung kürzer ist. */
  ariaLabel?: string;
  value: string;
  inaktiv: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const aktiv = value !== inaktiv;
  return (
    <label
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm md:min-h-8 ${
        aktiv ? "border-primary/50 bg-primary/10" : "border-input bg-card"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel ?? label}
        className={`max-w-40 cursor-pointer truncate bg-transparent pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          aktiv ? "font-semibold" : ""
        }`}
      >
        {children}
      </select>
    </label>
  );
}

export function DateChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm md:min-h-8 ${
        value ? "border-primary/50 bg-primary/10" : "border-input bg-card"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={`cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          value ? "font-semibold" : "text-muted-foreground"
        }`}
      />
    </label>
  );
}

/**
 * Filter zurücksetzen — dieselbe Aktion am Ende jeder Chipleiste.
 *
 * Sichtbar sind das Symbol und die Anzahl; der ausgeschriebene Satz steckt im
 * barrierefreien Namen und im Tooltip.  Die Zahl bleibt sichtbar, weil sie die
 * einzige Stelle ist, an der steht, wie viele Filter gesetzt sind — beide
 * Designgrundlagen schreiben sie fest.
 */
export function FilterResetChip({ count, onReset }: { count: number; onReset: () => void }) {
  if (count === 0) return null;
  const label = `${count} Filter zurücksetzen`;
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label={label}
      title={label}
      className="inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-8"
    >
      <X className="size-4" aria-hidden="true" />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

/**
 * Ein Schnellfilter als schaltbares Chip — dieselbe Form wie die
 * Dringlichkeitsfilter der Aufgabenübersicht.  Gesetzt heißt Markenakzent und
 * `aria-pressed`, nie Farbe allein.
 */
export function ToggleChip({
  aktiv,
  onToggle,
  children,
}: {
  aktiv: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={aktiv}
      onClick={onToggle}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-8 ${
        aktiv
          ? "border-primary/50 bg-primary/10 font-semibold text-foreground"
          : "border-input bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
