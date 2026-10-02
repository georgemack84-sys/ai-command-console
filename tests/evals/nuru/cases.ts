export type NuruEvalCase = { id: string; category: "duplicate" | "relationship" | "provenance" | "scope" | "freshness" | "canonical"; title: string; content: string; expected: Record<string, unknown> };

export const nuruEvaluationCases: NuruEvalCase[] = [
  { id: "obvious-duplicate", category: "duplicate", title: "Agent Service Boundary", content: "Archive and Search remain services rather than agents.", expected: { discovery: "CANDIDATE", qualityDuplicate: "EXACT_DUPLICATE", curator: "MERGE" } },
  { id: "subtle-duplicate", category: "duplicate", title: "Operational Boundary", content: "Infrastructure that persists or retrieves knowledge must be deterministic, not autonomous.", expected: { qualityDuplicate: "SEMANTIC_DUPLICATE", curator: "MERGE" } },
  { id: "unrelated-document", category: "relationship", title: "Ocean Currents", content: "Marine circulation patterns affect global climate.", expected: { connection: "NOT_RELATED" } },
  { id: "contradictory-decision", category: "relationship", title: "Archive Authority", content: "Agents may approve archival changes without human review.", expected: { connection: "CONTRADICTS", quality: "CONFLICT", curator: "REQUEST_REVIEW" } },
  { id: "superseded-architecture", category: "relationship", title: "Nuru Architecture V2", content: "This explicitly supersedes Nuru Architecture V1.", expected: { connection: "SUPERSEDES", governance: "HUMAN_REVIEW_REQUIRED" } },
  { id: "poor-provenance", category: "provenance", title: "Unattributed Policy", content: "Use this policy immediately.", expected: { quality: "NEEDS_REVIEW" } },
  { id: "ambiguous-project", category: "scope", title: "Boundary Rule", content: "Services enforce and agents reason.", expected: { context: "AMBIGUOUS_PROJECT", curator: "REQUEST_REVIEW" } },
  { id: "cross-project-relationship", category: "scope", title: "Other Project Boundary", content: "A separate project uses a similar agent/service design.", expected: { connection: "CROSS_PROJECT_REVIEW" } },
  { id: "outdated-information", category: "freshness", title: "Legacy Architecture", content: "The 2020 architecture uses direct agent database access.", expected: { quality: "PASS_WITH_WARNINGS" } },
  { id: "high-quality-canonical", category: "canonical", title: "Nuru V1 Agent Service Boundary", content: "Archive, Search, Metadata, Audit, Embeddings, Database, and Permissions remain deterministic services. Agents propose; governance authorizes.", expected: { discovery: "CANDIDATE", context: "Architecture Decision", quality: "PASS", curator: "ACCEPT", governance: "HUMAN_REVIEW_REQUIRED" } },
];
