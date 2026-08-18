# Concept: Event Communication Knowledge Service

## Summary

- GCW Base should include a service that ingests inbound and outbound email, links messages to events, and builds a structured event knowledge layer on top of the communication history.
- The service should not treat email as a flat archive; it should extract event facts, participants, commitments, risks, files, and unresolved questions.

## Core Pipeline

- `MailConnector`: syncs mailbox data from Outlook or another mail source.
- `MailIngestion`: stores immutable raw message metadata, bodies, headers, attachments, and thread relations.
- `EventMatcher`: assigns each message to one event, multiple candidate events, or an unassigned review queue.
- `KnowledgeExtractor`: derives structured facts such as dates, venue changes, pricing discussions, timing requirements, finance topics, and promised next steps.
- `EventKnowledgeStore`: persists verified event facts, communication summaries, timeline entries, and open questions.
- `ReviewQueue`: allows staff to confirm uncertain matches, merge duplicates, and promote extracted facts into trusted event knowledge.

## Recommended Data Shape

- `EmailMessage`: raw inbound or outbound message with sender, recipients, subject, thread id, timestamps, body, and attachment references.
- `EmailParticipant`: normalized person or functional mailbox extracted from headers.
- `EventMatch`: scored relation between a message and an event, including the matching reason and confidence.
- `CommunicationThread`: grouped messages relevant to one business conversation.
- `ExtractedFact`: machine-extracted statement with source message, fact type, value, confidence, and status.
- `EventKnowledgeItem`: curated event fact such as venue, billing contact, timing requirement, latest organizer decision, or risk.
- `EventOpenLoop`: unresolved item such as pending approval, missing file, unanswered question, or promised callback.

## Matching Strategy

- Start with deterministic signals first: known organizer domains, sender addresses, explicit event ids, event codes, invoice numbers, linked Time2Win ids, and thread references.
- Add heuristic signals second: event name mentions, venue mentions, contact-role overlap, date proximity, and attachment names.
- Use LLM-based classification only after deterministic and heuristic passes.
- Keep scoring explainable so users can see why a message was attached to an event.
- Preserve ambiguous matches instead of silently forcing a wrong event assignment.

## Knowledge Layers

- `Raw evidence`: immutable mail and attachment records.
- `Derived signals`: extracted entities, candidate events, detected intents, and fact candidates.
- `Trusted knowledge`: user-confirmed or highly reliable event facts used in the event record UI and automation.

## Product Behavior

- Each event should show a unified communication timeline with mail, notes, files, and extracted decisions.
- Users should see the latest known answer for operational questions such as who decides, what changed, what is still missing, and what was promised.
- The service should surface contradictions, for example two different start times from different messages.
- The system should create tasks or reminders from open loops instead of leaving them buried in threads.

## Communication Hub UX

The hub should be opened from an event and answer three questions immediately: what happened, what is currently valid, and what needs action.

Suggested event-detail layout:

- Header: event name, date, organizer, status, and a global search/filter.
- Left rail: `All`, `Unread`, `Needs action`, `Decisions`, `Files`, and channel filters.
- Main column: one chronological activity timeline combining emails, WhatsApp messages, call notes, internal notes, files, and system events.
- Right rail: `Latest facts`, `Open loops`, participants/roles, linked files, and a small `Needs review` queue.
- Each timeline item shows channel, direction, author/participants, timestamp, short preview, attachments, linked facts, and a confidence/source indicator.
- A pinned event summary should show the latest confirmed venue, timing, organizer contact, finance state, and outstanding commitments. Historical values remain inspectable rather than being overwritten.

Example interaction flow:

1. A new message enters through a channel adapter.
2. The ingestion module stores the original payload immutably and normalizes common fields.
3. Matching assigns an event or sends the item to review with an explainable score.
4. Extraction proposes facts, decisions, and open loops with links back to the source message.
5. A team member confirms, corrects, or rejects the proposal.
6. The event timeline and current summary update; optionally a task or reminder is created.

## Implementation Shape

### Outlook Folder Integration

The current convention of one Outlook folder per event is a strong initial integration seam. The connector can discover the folder tree, persist the Outlook folder ID together with the event, and synchronize messages from that folder into the event timeline. Microsoft Graph supports traversing child folders, listing messages in a folder, and delta synchronization for incremental changes.

Sent messages require an explicit policy:

- Best case: sent messages are moved or copied into the same event folder; folder membership is then the authoritative event link.
- Fallback: also inspect Sent Items and match by conversation ID, normalized subject, recipients, known contacts, event code, and date context.
- Always show the match reason and allow manual relinking when a sent message is ambiguous.

The first version should preferably use a shared mailbox or clearly selected mailbox account, store the Outlook message ID and web link, and keep only the required searchable content in the application according to the organization's privacy and retention rules.

Use one deep `CommunicationHub` module as the product seam. Its interface should expose event-centric queries and commands, while channel-specific complexity stays behind adapters:

- `ChannelAdapter`: Outlook/Microsoft Graph, WhatsApp provider, telephony/call notes, and manual notes.
- `RawMessageStore`: immutable payloads, headers, media, attachments, and source-specific identifiers.
- `Normalizer`: converts channel payloads into a common `CommunicationItem` without losing the original source data.
- `EventMatcher`: deterministic rules first, then heuristics, then optional LLM classification; every match includes reasons and confidence.
- `KnowledgeExtractor`: proposes typed facts, decisions, commitments, risks, and open loops.
- `ReviewQueue`: handles ambiguous matches, conflicting facts, duplicate threads, and privacy-sensitive items.
- `EventKnowledgeStore`: maintains event relations, temporal versions, confirmations, and audit history.

The UI should consume a small event-oriented interface such as `getEventCommunication(eventId, filters)`, `getEventBrief(eventId)`, `reviewCommunication(itemId, decision)`, and `createManualActivity(eventId, input)`. This keeps the seam stable when another channel is added.

## Delivery Recommendation

- Phase 1: manual notes and activities, one shared Outlook mailbox, raw storage, deterministic event matching, unified timeline.
- Phase 2: sent mail, attachments, review queue, thread summaries, open loops, and confirmed latest facts.
- Phase 3: WhatsApp/call adapters, richer conflict detection, reminders, permissions, and cross-event search.

Do not begin with unrestricted WhatsApp scraping or fully automatic fact updates. Start with auditable sources, explicit review for uncertain matches, and a clear separation between raw evidence, derived proposals, and trusted event knowledge.

## MVP Slice

- Make it very fast to add a phone-call note directly from an event.
- Show manual notes and email messages together in one event timeline and search result.
- Sync one shared mailbox or allow an initial email import.
- Store raw messages and attachments.
- Match messages to events using deterministic rules plus a manual correction action.
- Keep AI summaries and fact extraction optional until the basic collection and search workflow is reliable.
- Render the result in the event detail view as `Communication`, `Search`, and optionally `Open Follow-ups`.

The first phone-call form should require only: date/time, contact, direction (incoming/outgoing), and short note. It may optionally create a real event todo with title, due date, assignee, and source activity. The user should be able to save the note and todo in a few seconds without leaving the event.

Follow-ups should not be modeled as a special communication-only reminder. They should be ordinary event todos linked back to the originating call, email, or note. This makes them visible in the event's todo list, timeline, and later reporting.

The first search should search across event activities and mail with one query and return the event, channel, date, participants, and a highlighted text excerpt. Every result should link back to the original message or note.

## Later Phases

- Add sent-mail ingestion to capture the full conversation history.
- Ingest attachments into file storage with event linkage.
- Support cross-channel ingestion such as WhatsApp, calls, and notes.
- Add role-aware answers such as latest finance contact or latest timing requirement per event.
- Add retrieval over event knowledge for agent workflows and operator search.

## Risks

- Mailbox data is noisy and often lacks explicit event identifiers.
- Functional addresses can blur person-level responsibility.
- LLM extraction without a review layer will create silent data corruption.
- Some knowledge is temporal and should be versioned instead of overwritten.

## Related Pages

- [event-registry-and-management.md](event-registry-and-management.md)
- [organizer-account-model.md](organizer-account-model.md)
- [tool-consolidation-and-migration.md](tool-consolidation-and-migration.md)
- [../sources/2026-07-07-user-event-mail-knowledge-service.md](../sources/2026-07-07-user-event-mail-knowledge-service.md)

## Evidence

- [../sources/2026-07-07-user-event-mail-knowledge-service.md](../sources/2026-07-07-user-event-mail-knowledge-service.md)
