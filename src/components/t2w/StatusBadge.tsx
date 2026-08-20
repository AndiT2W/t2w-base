import { cn } from "@/lib/utils";
import { STATUS_LABEL, type EventStatus } from "@/lib/t2w/types";

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
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}
