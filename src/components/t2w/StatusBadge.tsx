import { cn } from "@/lib/utils";
import { RISK_LABEL, STATUS_LABEL, type EventStatus, type Risk } from "@/lib/t2w/types";

const STATUS_BG: Record<EventStatus, string> = {
  entwurf: "bg-status-entwurf",
  angefragt: "bg-status-angefragt",
  zugesagt: "bg-status-zugesagt",
  abgeschlossen: "bg-status-abgeschlossen",
  storniert: "bg-status-storniert",
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

export function RiskIndicator({ risiko }: { risiko: Risk }) {
  if (risiko === "keins") {
    return <span className="text-xs text-muted-foreground">–</span>;
  }
  const farbe = risiko === "kritisch" ? "bg-risk-kritisch" : "bg-risk-beobachten";
  return (
    <span
      title={RISK_LABEL[risiko]}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground"
    >
      <span className={cn("inline-block size-2 rounded-sm", farbe)} aria-hidden />
      {RISK_LABEL[risiko]}
    </span>
  );
}
