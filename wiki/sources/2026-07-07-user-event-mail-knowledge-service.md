# Source: User Request On Event Mail Knowledge Service

## Type

- User conversation on 2026-07-07

## Summary

- The user asked how a tool service could analyze incoming and outgoing emails, assign them to an event, and build a knowledge database so that all relevant event data is available in one place.

## Durable Claims

- Event-centered communication intelligence is a desired capability for GCW Base.
- The service should ingest both inbound and outbound email traffic.
- The service should classify or match communication to an event context.
- The service should accumulate reusable event knowledge rather than storing only a raw activity stream.

## Suggested Modeling Direction

- Distinguish between raw mail ingestion, event matching, extracted facts, and user-curated event knowledge.
- Treat the event as the primary aggregation context for communication-derived knowledge.

## Related Pages

- [../concepts/event-communication-knowledge-service.md](../concepts/event-communication-knowledge-service.md)
- [../concepts/event-registry-and-management.md](../concepts/event-registry-and-management.md)
- [../overview.md](../overview.md)
