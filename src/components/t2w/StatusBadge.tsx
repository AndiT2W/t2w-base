import { cn } from "@/lib/utils";
import { STATUS_LABEL, type EventStatus } from "@/lib/t2w/types";
import { useI18n } from "@/lib/i18n";

const STATUS_BG: Record<EventStatus, string> = {
  anfrage: "bg-status-angefragt",
  "angebot-gesendet": "bg-status-angefragt",
  abgesagt: "bg-status-storniert",
  akquise: "bg-status-angefragt",
  "datum-pruefen": "bg-status-angefragt",
  zugesagt: "bg-status-zugesagt",
};

export function StatusDot({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      aria-hidden
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
