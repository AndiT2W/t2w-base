/**
 * Rechenteil der Zeitachse: Aufgaben liegen dort relativ zum Eventdatum, nicht
 * in einem Kalenderraster. Alles rechnet auf ganzen UTC-Tagen, damit Sommerzeit
 * keine Rolle spielt.
 */

const DAY = 86400000;

/** ISO-Tag → Zeitstempel um Mitternacht UTC, oder null bei ungültiger Eingabe. */
export function isoDay(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(time) ? null : time;
}

export function dayToIso(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export type TimelineScale = {
  from: number;
  to: number;
  /** Spanne in Tagen, mindestens 1, damit nie durch null geteilt wird. */
  days: number;
};

/**
 * Spannt die Achse über alles, was gezeigt werden muss: die datierten Aufgaben,
 * den heutigen Tag und den Eventstart. Ohne diese drei gäbe es Aufgaben, die
 * außerhalb liegen, oder eine Achse, auf der das Event gar nicht vorkommt.
 */
export function timelineScale(
  dates: readonly (string | null | undefined)[],
  options: { today: string; eventStart?: string | null; paddingDays?: number },
): TimelineScale {
  const padding = options.paddingDays ?? 3;
  const points = dates
    .map(isoDay)
    .filter((value): value is number => value !== null)
    .concat(isoDay(options.today) ?? Date.now());

  const eventDay = isoDay(options.eventStart ?? null);
  if (eventDay !== null) points.push(eventDay);

  const from = Math.min(...points) - padding * DAY;
  const to = Math.max(...points) + padding * DAY;
  const days = Math.max(1, Math.round((to - from) / DAY));

  return { from, to: from + days * DAY, days };
}

/** Anteil von links, 0 bis 1. Werte außerhalb der Achse werden gekappt. */
export function timelinePosition(
  scale: TimelineScale,
  date: string | null | undefined,
): number | null {
  const day = isoDay(date);
  if (day === null) return null;
  const share = (day - scale.from) / (scale.days * DAY);
  return Math.min(1, Math.max(0, share));
}

/**
 * Beschriftungen der Achse. Gleichmäßig verteilte Tage statt Kalendermonaten:
 * die Achse zeigt Abstand zum Event, kein Kalenderraster.
 */
export function timelineTicks(scale: TimelineScale, count = 6): string[] {
  if (count < 2) return [dayToIso(scale.from)];
  const step = (scale.days * DAY) / (count - 1);
  return Array.from({ length: count }, (_, index) =>
    dayToIso(Math.round(scale.from + index * step)),
  );
}

/**
 * Verteilt Aufgaben einer Spur auf mehrere Reihen, damit nahe Termine sich
 * nicht überlagern. Eine Aufgabe kommt in die oberste Reihe, in der genug
 * Abstand zur vorherigen ist; reicht keine, in die am längsten freie. Dann
 * überlappt zwar wieder etwas, aber so spät wie möglich.
 */
export function timelineRows<T>(
  entries: readonly { item: T; position: number }[],
  minGap = 0.14,
  rows = 3,
): { item: T; position: number; row: number }[] {
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const lastInRow = Array.from({ length: Math.max(1, rows) }, () => -Infinity);

  return sorted.map(({ item, position }) => {
    let row = lastInRow.findIndex((last) => position - last >= minGap);
    if (row === -1) {
      const earliest = Math.min(...lastInRow);
      row = lastInRow.indexOf(earliest);
    }
    lastInRow[row] = position;
    return { item, position, row };
  });
}
