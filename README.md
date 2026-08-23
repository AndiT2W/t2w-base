# GCW Base Wiki

This repository contains the Karpathy-style LLM wiki for GCW Base, the planned Temptwin and Time2Win operations platform.

## Structure

- `raw/` holds immutable source material.
- `wiki/` holds the maintained Markdown knowledge base.
- `AGENTS.md` defines the operating rules the agent should follow.

## Recommended Workflow

1. Drop new material into `raw/inbox/`.
2. Ask the agent to ingest it into the wiki.
3. Let the agent update `wiki/overview.md`, relevant topic pages, and `wiki/log.md`.
4. Use the wiki as the first stop for future sessions.

## Starting Point

Begin in [wiki/index.md](wiki/index.md).

## CRM adapter

The deployed CRM adapter is the default. Set `VITE_CRM_ADAPTER=local` when starting the frontend to use the persistent local demo adapter instead. The adapters share the same Person/Kunde domain interface and are selected explicitly; there is no automatic fallback between data sources.

## Current Core Documents

- [Project Overview](wiki/overview.md)
- [Specification v1](wiki/specification-v1.md)
- [Delivery Phases](wiki/phases.md)
- [Roadmap](wiki/roadmap.md)
- [Migration Concept](wiki/concepts/tool-consolidation-and-migration.md)

