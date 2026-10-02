# Nuru Source Intelligence

Nuru Source Intelligence (NSI) governs the boundary between external information and Nuru's agents. It is not an agent and it does not grant external information authority by itself.

## Non-negotiable rule

No external information may enter Nuru's knowledge workflows without a source identity, a provenance record, and a policy decision.

## Source Constitution (NSI-01)

- Sources are admitted independently from their operational health.
- Only `APPROVED` and `LIMITED` sources may be acquired.
- `UNKNOWN` and `REVIEW_REQUIRED` sources require a human approval decision before a connector runs.
- `BLOCKED`, disabled, and paused sources cannot be acquired.
- A workspace manager must record a reason when approving, limiting, blocking, or pausing a source.
- A source's allowed acquisition methods are explicit. An agent may request acquisition but may not make a direct network call.
- A source record establishes permission to acquire material; it never establishes that a claim is true or canonical.

## Registry (NSI-02)

`NuruSourceRegistry` is the authoritative record for a publisher, domain, or supplied source. It deliberately remains separate from:

- `Source`, which is the existing workspace monitoring configuration; and
- `NuruSource`, which identifies a particular provenance-bearing artifact in the knowledge system.

The registry records identity, category, topics, allowed methods, cadence, admission state, operational state, review requirement, and fetch timestamps. A retrieval and immutable raw artifact are the next records in the NSI chain.

## Initial delivery sequence

1. Enforce the Source Constitution at connector dispatch.
2. Provide a human-only registry API and review workflow. Registry submission and approval are separate operations.
3. Add manual URL/file intake with raw artifact preservation. Text and base64-encoded document bytes are stored as immutable artifacts; URL retrieval waits for the governed web connector in NSI-04.
4. Add extraction, normalization, document versions, and provenance envelopes.

## Extraction and normalization (NSI-09/10)

The initial extractor supports TXT, Markdown, and HTML. It produces a `NuruNormalizedDocument` linked to exactly one raw artifact, with content hash, sections, extraction method, and status. PDF and DOCX originals remain preserved and receive `EXTRACTION_PENDING` until dedicated parsers are introduced. Extraction never admits material to canonical knowledge.
