# Phase 6 Qualification

Phase identifier: D2D.6
Phase name: Conversation Foundation and AI Gateway
Status: CONDITIONALLY_QUALIFIED

Qualified locally:

- Persistent conversations and append-only messages.
- Conversation lifecycle: create, rename, archive, restore, delete-request archival, continue, retry, export, and search.
- AI Gateway abstraction with deterministic mock provider plus hosted/local adapter shells.
- Prompt registry with immutable active prompt version recording.
- Structured advisory response validation and side-effect rejection.
- Usage logging, token estimation, provider health records, and per-user AI settings.
- Conversation UI, assistant chat UI, stream chunk display, provider settings, prompt inspection, usage inspection, and export.

Conditional items:

- Streaming is represented as deterministic chunk payloads rather than live server-sent events.
- Hosted and local adapters are interface-complete shells; live network inference is deferred.
- Token counting and cost estimation are approximate.
- Browser end-to-end coverage remains smoke-level; service tests cover core Phase 6 behavior.
