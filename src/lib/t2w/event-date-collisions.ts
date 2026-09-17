export type EventDateRange = {
  id: string;
  name: string;
  start: string;
  ende: string;
  services: readonly string[];
};

export type EventDateCollision = {
  groupIndex: number;
  eventCount: number;
  peerNames: string[];
};

type NormalizedEventDateRange = EventDateRange & {
  normalizedStart: string;
};

const COLLISION_SERVICES = new Set(["active", "uhf"]);

function hasCollisionService(event: EventDateRange): boolean {
  return event.services.some((service) => COLLISION_SERVICES.has(service.trim().toLowerCase()));
}

function normalizeIsoDate(value: string): string | null {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? null;
}

function normalizeEventDateRange(event: EventDateRange): NormalizedEventDateRange | null {
  const start = normalizeIsoDate(event.start);
  if (!start) return null;

  return {
    ...event,
    normalizedStart: start,
  };
}

/**
 * Groups visible Active/UHF events that start on the same calendar day. The event
 * end date is deliberately ignored: a multi-day event must not color unrelated
 * start dates. Events with other services do not participate in the count.
 */
export function createEventDateCollisionMap(
  events: readonly EventDateRange[],
): Map<string, EventDateCollision> {
  const normalizedEvents = events
    .filter(hasCollisionService)
    .map(normalizeEventDateRange)
    .filter((event): event is NormalizedEventDateRange => event !== null)
    .sort((left, right) => left.id.localeCompare(right.id));
  const eventsByStartDate = new Map<string, NormalizedEventDateRange[]>();

  normalizedEvents.forEach((event) => {
    eventsByStartDate.set(event.normalizedStart, [
      ...(eventsByStartDate.get(event.normalizedStart) ?? []),
      event,
    ]);
  });

  const collisionGroups = [...eventsByStartDate.entries()]
    .filter(([, groupEvents]) => groupEvents.length > 1)
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate));

  const collisions = new Map<string, EventDateCollision>();
  collisionGroups.forEach(([, groupEvents], groupIndex) => {
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
