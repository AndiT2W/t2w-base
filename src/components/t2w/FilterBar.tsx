import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Eine Filterleiste für alle Listen.  Die Chips stehen in `FilterChip.tsx`;
 * hier ist nur die Leiste, die sie trägt, damit Abstand, Umbruch und die
 * rechte Werkzeugecke nicht je Modul neu erfunden werden.
 *
 * `werkzeuge` sitzt rechtsbündig — dort stehen Spaltenwahl und Export, auf
 * jeder Seite an derselben Stelle.
 */
export function FilterBar({ children, werkzeuge }: { children: ReactNode; werkzeuge?: ReactNode }) {
  return (
    <div
      role="group"
      aria-label="Liste filtern"
      className="flex flex-wrap items-center gap-2 border-b border-border pb-3"
    >
      {children}
      {werkzeuge && <div className="ml-auto flex items-center gap-1.5">{werkzeuge}</div>}
    </div>
  );
}

/**
 * Trennt Schnellfilter von den Auswahlfeldern in derselben Leiste.
 * Rein sichtbar; für Bildschirmleser ist die Leiste eine Gruppe.
 */
export function FilterTrenner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("h-5 w-px shrink-0 bg-border", className)} />;
}
