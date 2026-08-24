# 2026-08-23 User Codex Gateway Brief

## Source

- User conversation on 2026-08-23.
- Published specification: [GitHub issue #32](https://github.com/AndiT2W/t2w-base/issues/32).

## Durable claims

- `t2w-base` should provide one central containerized Codex gateway for use by multiple internal services.
- The initial authentication should reuse the existing ChatGPT Plus account and its shared usage limits.
- Consumers should call a stable internal T2W task interface instead of depending directly on Codex protocols.
- The first workflow is `mail-summary`; mail retrieval and delivery remain separate adapters.
- The gateway should support later migration to API-key or workspace authentication without changing consumers.

## Specification boundary

- The MVP uses registered, versioned workflows and does not expose arbitrary prompts, shell permissions, callbacks, or public network access.
- It includes queueing, stable task/error states, schema validation, a persistent authentication volume, and a real HTTP regression test using a deterministic fake Codex adapter.
