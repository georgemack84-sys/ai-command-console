export const SUPPORTED_SCORING_MODEL_VERSIONS = Object.freeze([
  "deterministic-confidence-model-v1",
] as const);

export const SUPPORTED_NORMALIZATION_VERSIONS = Object.freeze([
  "confidence-normalization-v1",
] as const);

export const SUPPORTED_WEIGHT_TABLE_VERSIONS = Object.freeze([
  "confidence-weight-table-v1",
] as const);

export const CONFIDENCE_WEIGHT_TABLE = Object.freeze({
  evidence_quality: 0.18,
  evidence_completeness: 0.12,
  replay_consistency: 0.16,
  governance_alignment: 0.14,
  policy_stability: 0.1,
  proposal_integrity: 0.12,
  audit_consistency: 0.1,
  model_validity: 0.08,
} as const);

export const CONFIDENCE_BLOCKED_SEMANTICS = Object.freeze([
  "execute",
  "execution",
  "schedule",
  "scheduler",
  "orchestrate",
  "orchestration",
  "mutate",
  "runtime",
  "authority",
  "escalate",
] as const);
