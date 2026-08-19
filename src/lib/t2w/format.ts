export function formatDatum(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function formatZeitraum(start: string, ende: string): string {
  if (start === ende) return formatDatum(start);
  const [ys, ms] = start.split("-");
  const [ye, me] = ende.split("-");
  if (ys === ye && ms === me) {
    return `${start.split("-")[2]}.–${formatDatum(ende)}`;
  }
  if (ys === ye) return `${start.split("-")[2]}.${ms}. – ${formatDatum(ende)}`;
  return `${formatDatum(start)} – ${formatDatum(ende)}`;
}

export function tageZwischen(start: string, ende: string): number {
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${ende}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function heuteIso(): string {
  return new Date().toISOString().slice(0, 10);
}
