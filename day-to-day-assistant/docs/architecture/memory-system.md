# Memory System

Phase D2D.9 adds transparent, user-owned long-term memory.

Durable memories are categorized as `Preference`, `Routine`, `Commitment`, `Reference`, `Interaction`, `Outcome`, or `Correction`. They have confidence, sensitivity, source, validity windows, status, version history, and retrieval metadata.

Memory is not created from conversation by default. Creation requires an explicit API request, a memory proposal decision, a confirmed preference, an approved routine, a successful workflow, or another documented application policy. Archived, deleted, expired, disabled-category, and privacy-disabled memories are excluded from default retrieval.

Retrieval is deterministic. It scores relevant active memories using query term overlap, confidence, and recency, records a retrieval audit entry, and exposes the reason and relevance map.
