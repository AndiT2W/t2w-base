export type EventDateRange = {
  id: string;
  name: string;
  start: string;
  ende: string;
};

export type EventDateCollision = {
  groupIndex: number;
  eventCount: number;
  peerNames: string[];
};

type NormalizedEventDateRange = EventDateRange & {
  normalizedStart: string;
  normalizedEnd: string;
};

function normalizeIsoDate(value: string): string | null {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? null;
}

function normalizeEventDateRange(event: EventDateRange): NormalizedEventDateRange | null {
  const start = normalizeIsoDate(event.start);
  const end = normalizeIsoDate(event.ende);
  if (!start || !end) return null;

  return {
    ...event,
    normalizedStart: start <= end ? start : end,
    normalizedEnd: start <= end ? end : start,
  };
}

/**
 * Groups visible events whose inclusive date ranges overlap. Transitive overlaps
 * stay in one visual group so connected scheduling conflicts share one color.
 */
export function createEventDateCollisionMap(
  events: readonly EventDateRange[],
): Map<string, EventDateCollision> {
  const normalizedEvents = events
    .map(normalizeEventDateRange)
    .filter((event): event is NormalizedEventDateRange => event !== null)
    .sort(
      (left, right) =>
        left.normalizedStart.localeCompare(right.normalizedStart) ||
        left.normalizedEnd.localeCompare(right.normalizedEnd) ||
        left.id.localeCompare(right.id),
    );

  const collisionGroups: NormalizedEventDateRange[][] = [];
  let currentGroup: NormalizedEventDateRange[] = [];
  let currentGroupEnd = "";

  normalizedEvents.forEach((event) => {
    if (currentGroup.length === 0 || event.normalizedStart <= currentGroupEnd) {
      currentGroup.push(event);
      if (event.normalizedEnd > currentGroupEnd) currentGroupEnd = event.normalizedEnd;
      return;
    }

    if (currentGroup.length > 1) collisionGroups.push(currentGroup);
    currentGroup = [event];
    currentGroupEnd = event.normalizedEnd;
  });
  if (currentGroup.length > 1) collisionGroups.push(currentGroup);

  const collisions = new Map<string, EventDateCollision>();
  collisionGroups.forEach((groupEvents, groupIndex) => {
    groupEvents.forEach((event) => {
      collisions.set(event.id, {
        groupIndex,
        eventCount: groupEvents.length,
        peerNames: groupEvents
          .filter((peer) => peer.id !== event.id)
          .map((peer) => peer.name)
          .sort((left, right) => left.localeCompare(right, "de")),
      });
    });
  });

  return collisions;
}
