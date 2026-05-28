export const RECOMMENDATION_SYNTHESIS_CATEGORIES = Object.freeze([
  "approval",
  "containment",
  "escalation",
  "governance",
  "recovery",
  "risk",
  "stability",
  "validation",
] as const);

export const RECOMMENDATION_SYNTHESIS_LIFECYCLE = Object.freeze([
  "certified_evidence_intake",
  "input_validation",
  "governance_correlation",
  "evidence_correlation",
  "constraint_validation",
  "recommendation_synthesis",
  "confidence_derivation",
  "rationale_binding",
  "replay_binding",
  "deterministic_serialization",
  "immutable_audit_binding",
  "append_only_recording",
  "certified_recommendation_output",
] as const);

export const RECOMMENDATION_SYNTHESIS_FORBIDDEN_TERMS = Object.freeze([
  "execute",
  "dispatch",
  "schedule",
  "enqueue",
  "worker",
  "queue",
  "adapter",
  "retry until success",
  "self-heal",
  "auto-remediate",
  "orchestrate",
] as const);
