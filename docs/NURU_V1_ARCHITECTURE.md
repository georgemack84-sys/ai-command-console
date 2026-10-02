# Nuru V1 Architecture Boundary

## Agents

- Nuru Curator
- Discovery Agent
- Context Agent
- Connection Agent
- Quality Agent

Agents are for judgment, interpretation, reasoning, evaluation, and synthesis. They produce structured, validated proposals and never receive direct infrastructure authority.

## Services

- Archive Service
- Search Service
- Metadata Service
- Audit Service
- Embeddings Service
- Database Service
- Permissions Service

Services are for reliable storage, retrieval, validation, enforcement, indexing, and deterministic execution.

## Enforced rule

> Create an agent when a responsibility requires judgment, interpretation, reasoning, or synthesis. Create a service when it requires reliable storage, retrieval, validation, enforcement, indexing, or deterministic execution.

The Nuru repository module is the only Nuru code that imports the Prisma client. Agents invoke controlled runtime tools and services; they do not import database, filesystem, audit, permissions, or vector-store infrastructure.

## Agent Tool Registry

Agents invoke approved capabilities only through `NuruToolRegistry`. Each tool declares
its purpose, Zod input/output contracts, least-privilege permission, rate limit, and
audit behavior. The registry validates both boundaries, authorizes the named agent,
enforces its limit, and records audited invocations. It never exposes arbitrary
callbacks, database clients, filesystem access, or vector-store handles.

## Agent identities

Every agent has a versioned identity: `agent_id`, role/type, model, declared
permissions and tools, policy profile, prompt version, and lifecycle status. The
runtime records an immutable identity snapshot with every agent run, so a curation
judgment can always be attributed to the exact profile that made it.

## Structured agent outputs

Each specialist and the Curator returns a Zod-validated object, not free-form
reasoning. The runtime validates that object before marking a run successful or
persisting its result; schema failures are recorded as `invalid_output`. Narrative
explanations remain bounded fields within the contract alongside machine-readable
classification, issues, relationships, confidence, and evidence.

## Confidence model

Nuru uses one score interpretation: `LOW` (0.00–0.39), `MODERATE`
(0.40–0.69), `HIGH` (0.70–0.89), and `VERY_HIGH` (0.90–1.00). Confidence is
never authority. Governance combines the score and its band with evidence quality,
source authority, policy satisfaction, and conflict state before an item may proceed
to human approval or an archive action.

## Sources and provenance

Nuru registers sources with an ID, type, origin, author, retrieval and creation
times, authority, version, checksum, and location. `AGENT_OUTPUT` is accepted only
as low-authority derived evidence with an explicit originating source ID. It is never
silently treated as a human decision or as equivalent canonical authority.

## Provenance chain

Every archived item receives an ordered, append-only lineage: source, Discovery,
Context, optional Connection and Quality runs, Curation Proposal, Human Approval,
and the resulting Knowledge Item. Each link has a stage, immutable reference, actor,
and details, allowing Nuru to answer where an item came from without reconstructing
claims from free-form logs.

## Relationship graph

Knowledge is connected through typed graph edges—not only flat tags. The Connection
Agent proposes `PROPOSED` edges with evidence; `NuruGraphService` validates their
shape, stores them, audits the proposal, and deterministically traverses approved
relationships. It never infers the meaning or approval of an edge itself.

## Duplicate detection

`NuruDuplicateService` records structured assessments for exact (normalized content
hash), possible/near (title and metadata), semantic (embedding similarity), and
updated-version matches. Connection and Quality consume that evidence through the
controlled tool registry; a duplicate result is evidence for review, never an
autonomous merge or overwrite.

## Contradiction detection

Quality uses `NuruContradictionService` to record potential competing claims and
their review questions. A contradiction is not a destructive instruction: Nuru asks
whether scope, architecture history, versioning, or an explicit exception explains
the difference, and leaves any supersession to governance and human approval.

## Supersession workflow

Architectural evolution follows an explicit review: `REJECT`, `COEXIST`,
`NARROW_SCOPE`, or `SUPERSEDE`. Only the last option invokes the governance archive
operation, which marks the earlier item `SUPERSEDED`, keeps it intact forever, makes
the approved successor current, and records bidirectional historical relationships.

## Project awareness

Knowledge has one validated primary project plus zero or more distinct related
projects. Context proposes this scope; `NuruProjectService` normalizes it; and the
archive persists it. This preserves project boundaries while making cross-project
architecture discoverable without assigning an item to every project equally.

## Cross-project connections

The Connection Agent uses controlled ecosystem retrieval to find evidence-backed
`PROPOSED` relationships in other projects. Nuru can therefore surface recurring
principles—such as separate authority and enforcement—without collapsing distinct
project records or treating a proposed link as an approved architecture decision.

## Curation queue

Nuru tracks curation work through explicit states: `DISCOVERED`, `TRIAGED`,
`ANALYZING`, `WAITING`, `READY_FOR_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`,
and `SUPERSEDED`. Queue lanes identify auto-accept eligibility, human review,
conflict review, or insufficient evidence; eligibility remains a triage label and
does not bypass the Governance Gate.

## Priority engine

`NuruPriorityService` deterministically orders queue work from an explainable score:
architecture importance, novelty, project relevance, source authority, conflict risk,
relationship count, likely duplication, age, and explicit human priority. Curator
recommendations remain evidence; the Priority Engine owns queue ordering.

## Human feedback loop

Every human review decision is captured as an append-only feedback record containing
the Curator recommendation, the human decision, the reason, reviewer, and optional
scope. These records form a pending evaluation dataset for later review. The feedback
service has no capability to change an agent prompt, policy profile, model, identity,
or permissions: changes to any of those must be a separately reviewed update.

## Curator memory

Before each curation run, `NuruCuratorMemoryService` builds a bounded, read-only
context packet for the selected project: canonical architecture, project rules,
active conflicts, pending reviews, recent decisions, approved relationships, and
the fixed curation policies. The packet contains references and counts rather than
unbounded document history. Retrieval failure is explicit (`unavailable`) and
degrades the run without granting fallback access to raw storage.

## Agent collaboration protocol

Specialists cannot message each other. `NuruAgentCollaborationProtocol` admits only
`nuru.curator.v1` as coordinator and enforces the bounded `FAST` (Discovery →
Context) or `STANDARD` (Discovery → Context → Connection → Quality) sequence.
Every dispatch and returned result is audited with the workflow step and correlation
ID, making the workflow permission-controlled, cost-bounded, and replayable.

## Workflow templates

`NuruWorkflowTemplateService` deterministically selects `FAST_PATH`,
`STANDARD_PATH`, `CONFLICT_PATH`, or `HIGH_AUTHORITY_PATH` from source authority
and risk signals. Conflict takes precedence over authority. Templates declare their
bounded stages and review/archive eligibility; the Curator receives the selected
template as context but still cannot bypass Governance or human approval.

## Cost and budget controls

Each selected template creates an immutable run budget covering maximum agents,
model calls, tokens, tool calls, and duration. The collaboration protocol charges a
bounded estimate before dispatching each specialist and fails closed when any limit
would be exceeded. Fast-path work is limited to two agents and four model calls;
conflict work permits four agents and up to twelve calls only when policy selects it.

## Model routing

`NuruModelRouter` resolves a model route per run from agent role, complexity,
privacy, cost, latency, reasoning need, and context size. Discovery can use the
fast tier; Context and Connection use reasoning; Quality and Curator use the
strongest reasoning tier. `LOCAL_ONLY` privacy overrides every other preference.
The resolved route is recorded with the immutable run snapshot rather than being
permanently bound to an agent identity.

## Replayability

Curator run records retain their bounded curation input, resolved model route, prompt
version, and policy version. `NuruCurationReplayService` reloads that input into a
new run under a candidate version set and returns a structured comparison of the
original and replayed recommendations. The original run remains immutable.

## V1 pipeline

```text
Information → Discovery → Context → Connection → Quality → Curator
            → Curation Proposal → Governance → Human Review → Archive
```

Governance and human authority are separate from Curator reasoning. Confidence is evidence, not authority. History is superseded, not erased.
