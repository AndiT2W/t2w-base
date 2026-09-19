import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus } from "@/lib/t2w/types";
import { useI18n } from "@/lib/i18n";

/**
 * Jeder Eventstatus hat seit dem 19.09.2026 eine eigene Farbe (Nutzerwunsch).
 * Vorher trugen vier Status dasselbe Amber, womit der Punkt den Status nicht
 * benennen konnte.  Die Farbe bleibt trotzdem nie der alleinige Träger: der
 * Punkt hat Tooltip und Screenreader-Text, und unter der Tabelle steht die
 * Legende.
 */
const STATUS_BG: Record<EventStatus, string> = {
  akquise: "bg-status-akquise",
  anfrage: "bg-status-angefragt",
  "angebot-gesendet": "bg-status-angebot",
  "datum-pruefen": "bg-status-datum-pruefen",
  zugesagt: "bg-status-zugesagt",
  abgesagt: "bg-status-storniert",
};

export function StatusDot({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      aria-hidden
      data-status-dot={status}
      className={cn("inline-block size-2.5 shrink-0 rounded-full", STATUS_BG[status], className)}
    />
  );
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded-[4px] border border-border bg-surface px-1.5 text-[11px] font-semibold leading-4 text-foreground">
      <StatusDot status={status} />
      {t(`status.${status}` as Parameters<typeof t>[0])}
    </span>
  );
}

/**
 * Erklärt die Farbpunkte der Statusspalte.  Sie steht unter den Eventtabellen
 * und erst ab Desktopbreite: auf schmalen Ansichten zeigen die Karten ohnehin
 * Punkt und Text nebeneinander.
 */
export function StatusLegend() {
  const { t } = useI18n();
  return (
    <div
      aria-label="Statuslegende"
      className="hidden flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground md:flex"
    >
      {STATUS_ORDER.map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <StatusDot status={status} />
          {t(`status.${status}` as Parameters<typeof t>[0])}
        </span>
      ))}
    </div>
  );
}
