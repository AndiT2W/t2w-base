import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Eine Kennzahl über einer Liste.  Bis zur Vereinheitlichung trug jedes Modul
 * seine eigene Form: die Übersicht eine lose Textzeile, Hardware eine eigene
 * Metrikleiste, Auszahlungen gar keine.  Hier ist es eine Kachel, überall
 * gleich hoch und gleich gesetzt.
 *
 * Die Kachel ist immer eine Schaltfläche: sie setzt den Filter der Liste
 * darunter.  `aktiv` markiert den gesetzten Zustand — mit Rahmen, nicht nur
 * mit Farbe.
 *
 * `detail` hängt eine Erläuterung an die Kachel, die bei Zeigerkontakt, bei
 * Tastaturfokus und bei Berührung erscheint.  Reines Überfahren würde weder
 * Tastatur noch Touch erreichen, darum trägt die Kachel `aria-describedby`
 * und das Feld bleibt im Fluss der Tastaturbedienung.
 */
export function MetricTile({
  icon: Icon,
  label,
  wert,
  hinweis,
  ton,
  aktiv,
  detail,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  wert: ReactNode;
  hinweis?: string;
  /** `warn` und `krit` färben nur die Zahl, nie die Fläche. */
  ton?: "warn" | "krit";
  aktiv?: boolean;
  detail?: ReactNode;
  onClick?: () => void;
  /** Fuer Kacheln, die eine Seite auf dem Telefon weglaesst. */
  className?: string;
}) {
  const detailId = useId();
  const zahlKlasse =
    ton === "krit"
      ? "text-risk-kritisch"
      : ton === "warn"
        ? "text-task-waiting-strong"
        : "text-foreground";

  const knopf = (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv ?? undefined}
      {...(detail ? { "aria-describedby": detailId } : {})}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-xl border bg-card px-3.5 py-2.5 text-left transition-colors hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        aktiv ? "border-primary" : "border-border",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon
          className={cn("size-4 shrink-0", ton ? zahlKlasse : "text-muted-foreground")}
          aria-hidden="true"
        />
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-[25px] font-bold leading-none tracking-tight tabular-nums",
            zahlKlasse,
          )}
        >
          {wert}
        </span>
        {hinweis && <span className="text-xs text-muted-foreground">{hinweis}</span>}
      </span>
    </button>
  );

  /*
   * `min-w-[9rem]` statt `min-w-0`: ohne Mindestbreite schrumpfen vier Kacheln
   * auf dem Telefon nebeneinander, bis die Beschriftung dreizeilig bricht und
   * die letzte aus dem Bild ragt. Mit ihr bricht die Reihe auf zwei um.
   */
  if (!detail) return <div className={cn("min-w-[9rem] flex-1", className)}>{knopf}</div>;

  return (
    <div className={cn("group relative min-w-[9rem] flex-1", className)}>
      {knopf}
      <div
        role="tooltip"
        id={detailId}
        className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-20 w-80 rounded-xl border border-border bg-card p-3 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      >
        {detail}
      </div>
    </div>
  );
}

/** Die Kachelreihe.  Gleicher Abstand über allen Modulen. */
export function MetricRow({ children }: { children: ReactNode }) {
  // Die Reihe traegt einen Namen: eine Vorlesehilfe soll sie als Block
  // ansagen koennen statt vier lose Zahlen, und die Browsertests greifen die
  // Kacheln damit an, ohne auf Text zu raten, der auch in der Tabelle steht.
  return (
    <div role="group" aria-label="Kennzahlen" className="flex flex-wrap gap-2.5">
      {children}
    </div>
  );
}
