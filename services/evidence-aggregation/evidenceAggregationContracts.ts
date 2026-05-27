export const EVIDENCE_AGGREGATION_TYPES = Object.freeze([
  "governance",
  "integrity",
  "operator",
  "policy",
  "replay",
  "telemetry",
  "validation",
] as const);

export const EVIDENCE_AGGREGATION_PIPELINE = Object.freeze([
  "session_start",
  "boundary_validation",
  "evidence_normalization",
  "deterministic_ordering",
  "governance_binding",
  "replay_binding",
  "conflict_detection",
  "lineage_recording",
  "audit_binding",
  "session_completion",
] as const);

export const EVIDENCE_AGGREGATION_SCHEMA_VERSION = "5.1B";
export const EVIDENCE_ORDERING_VERSION = "evidence-ordering-v1";
