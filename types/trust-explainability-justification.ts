export type TrustExplainabilityOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ExplanationLevel = "EXECUTIVE_SUMMARY" | "OPERATOR_VIEW" | "AUDITOR_VIEW" | "GOVERNANCE_VIEW" | "TECHNICAL_VIEW";
export type ExplanationEvidenceStatus = "AUTHORITATIVE" | "MISSING" | "UNVERIFIABLE";

export type TrustExplainabilityFailure =
  | "P5_10_SAFETY_QUALIFICATION_INVALID"
  | "TRUST_EXPLANATION_ENGINE_MISSING"
  | "EXPLANATION_BUILDER_MISSING"
  | "EVIDENCE_TRACE_SERVICE_MISSING"
  | "JUSTIFICATION_GENERATOR_MISSING"
  | "CONSTITUTIONAL_EXPLAINER_MISSING"
  | "POLICY_EXPLAINER_MISSING"
  | "RISK_EXPLAINER_MISSING"
  | "ALIGNMENT_EXPLAINER_MISSING"
  | "TRANSPARENCY_SERVICE_MISSING"
  | "REPORT_GENERATOR_MISSING"
  | "TRUST_DECISION_MISSING"
  | "MULTIPLE_EXPLANATIONS_FOR_DECISION"
  | "AUTHORITATIVE_EVIDENCE_MISSING"
  | "UNVERIFIABLE_EVIDENCE_REFERENCED"
  | "EXPLANATION_CONTRADICTS_DECISION"
  | "CONSTITUTIONAL_AUTHORITY_MISSING"
  | "POLICY_AUTHORITY_MISSING"
  | "AUTHORITY_CHAIN_MISSING"
  | "VISIBILITY_BOUNDARY_VIOLATED"
  | "REASONING_CHAIN_INCOMPLETE"
  | "REASONING_CHAIN_NONDETERMINISTIC"
  | "EXPLANATION_NOT_REPRODUCIBLE"
  | "EXPLANATION_NOT_REPLAYABLE"
  | "EXPLANATION_NOT_EVIDENCE_BACKED"
  | "EXPLANATION_NOT_CONSTITUTIONALLY_GROUNDED"
  | "EXPLANATION_NOT_POLICY_GROUNDED"
  | "EXPLANATION_NOT_AUTHORITY_VALIDATED"
  | "EXPLANATION_MUTABLE_AFTER_PUBLICATION"
  | "JUSTIFICATION_REPORT_INCOMPLETE"
  | "TRANSPARENCY_RECORD_MISSING"
  | "TRANSPARENCY_RECORD_UNAUTHORIZED"
  | "TRUST_COMPUTATION_EXECUTED"
  | "EVIDENCE_GENERATED"
  | "RISK_MODELING_EXECUTED"
  | "POLICY_EVALUATION_EXECUTED"
  | "TRUST_QUALIFICATION_EXECUTED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustExplainabilityScenario = "BASELINE" | TrustExplainabilityFailure;
export type TrustExplainabilityInput = Readonly<{ scenario?: TrustExplainabilityScenario; trust_decision_id?: string; trust_identity?: string; explanation_level?: ExplanationLevel }>;

export type TrustExplanation = Readonly<{
  explanation_id: string;
  trust_decision_id: string;
  trust_identity: string;
  explanation_summary: string;
  reasoning_chain: readonly string[];
  evidence_refs: readonly string[];
  constitutional_refs: readonly string[];
  policy_refs: readonly string[];
  alignment_refs: readonly string[];
  safety_refs: readonly string[];
  confidence_refs: readonly string[];
  replay_refs: readonly string[];
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type ExplanationTrace = Readonly<{ trace_id: string; evidence_status: ExplanationEvidenceStatus; evidence_origin: readonly string[]; evidence_version: readonly string[]; evidence_lineage: readonly string[]; evidence_integrity: readonly string[]; replay_references: readonly string[]; certification_references: readonly string[]; complete: boolean; integrity_hash: string }>;
export type JustificationReport = Readonly<{ report_id: string; trust_identity: string; trust_decision: string; evidence_summary: string; constitutional_analysis: string; policy_analysis: string; risk_analysis: string; alignment_analysis: string; authority_analysis: string; final_justification: string; integrity_hash: string }>;
export type TransparencyRecord = Readonly<{ transparency_id: string; trust_identity: string; explanation_level: ExplanationLevel; visible_reasoning: readonly string[]; evidence_visibility: readonly string[]; policy_visibility: readonly string[]; authority_visibility: readonly string[]; replay_reference: string; audit_reference: string; visibility_boundary_preserved: boolean; integrity_hash: string }>;
export type ExplanationGraph = Readonly<{ graph_id: string; nodes: readonly string[]; edges: readonly string[]; deterministic: boolean; reproducible: boolean; replayable: boolean; immutable_after_publication: boolean; integrity_hash: string }>;
export type ExplanationComponentState = Readonly<{ engine_id: string; explanation_builder: boolean; evidence_trace_service: boolean; justification_generator: boolean; constitutional_explainer: boolean; policy_explainer: boolean; risk_explainer: boolean; alignment_explainer: boolean; transparency_service: boolean; replay_validator: boolean; report_generator: boolean; integrity_hash: string }>;
export type ExplainabilityBoundary = Readonly<{ boundary_id: string; trust_computation_executed: boolean; evidence_generation_executed: boolean; risk_modeling_executed: boolean; policy_evaluation_executed: boolean; trust_qualification_executed: boolean; integrity_hash: string }>;
export type TrustExplainabilityCertification = Readonly<{ certification_id: string; outcome: TrustExplainabilityOutcome; phase_ready: boolean; all_decisions_explained: boolean; exactly_one_explanation_per_decision: boolean; evidence_traceability_complete: boolean; constitutional_reasoning_documented: boolean; policy_reasoning_documented: boolean; authority_reasoning_documented: boolean; transparency_records_generated: boolean; replay_reproduces_explanation: boolean; justification_reports_complete: boolean; invariants_satisfied: boolean; boundary_respected: boolean; failures: readonly TrustExplainabilityFailure[]; integrity_hash: string }>;
export type TrustExplainabilityResult = Readonly<{ phase_version: "trust-explainability-justification/v5.11"; phase_identifier: "TrustExplainabilityJustification"; safety_qualification_ref: "trust-safety-qualification/v5.10"; components: ExplanationComponentState; explanation: TrustExplanation; trace: ExplanationTrace; graph: ExplanationGraph; justification: JustificationReport; transparency: TransparencyRecord; boundary: ExplainabilityBoundary; certification: TrustExplainabilityCertification; replay_hash: string; integrity_hash: string }>;
export type TrustExplainabilityValidation = Readonly<{ valid: boolean; outcome: TrustExplainabilityOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; components_valid: boolean; explanation_valid: boolean; trace_valid: boolean; graph_valid: boolean; justification_valid: boolean; transparency_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustExplainabilityFailure[]; integrity_hash: string }>;
export type TrustExplainabilityBundle = Readonly<{ doctrine: Readonly<{ version: "trust-explainability-justification/v5.11"; owns_explainability: true; owns_trust_reasoning: true; owns_decision_justification: true; owns_transparency: true; creates_trust_decisions: false; computes_trust: false; generates_evidence: false; models_risk: false; evaluates_policy: false; qualifies_trust: false }>; result: TrustExplainabilityResult; validation: TrustExplainabilityValidation }>;
