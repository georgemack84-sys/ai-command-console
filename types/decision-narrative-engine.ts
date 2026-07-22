import type { ExplanationRecord, ExplanationType } from "@/types/explainability-contract";

export type NarrativeType = "PLANNING" | "EXECUTION" | "DELEGATION" | "GOVERNANCE" | "SUPERVISION" | "RECOVERY" | "PREDICTION";
export type NarrativeState = "DECISION_CREATED" | "EVIDENCE_RETRIEVED" | "POLICY_ANALYSIS" | "CONSTITUTION_ANALYSIS" | "AUTHORITY_ANALYSIS" | "CONFIDENCE_ANALYSIS" | "RISK_ANALYSIS" | "NARRATIVE_ASSEMBLY" | "FORMATTING" | "VALIDATION" | "TRUTH_LEDGER_REGISTRATION" | "REJECTED";
export type NarrativeScenario = "BASELINE" | "INCOMPLETE_DECISION_RECORD" | "MISSING_EVIDENCE" | "MISSING_SELECTED_PLAN" | "UNDOCUMENTED_REJECTED_ALTERNATIVES" | "MISSING_GOVERNANCE_REFERENCES" | "MISSING_CONSTITUTIONAL_VALIDATION" | "MISSING_AUTHORITY_APPROVAL" | "UNREPRODUCIBLE_CONFIDENCE_RISK" | "INVALID_REPLAY_REFERENCE" | "NONDETERMINISTIC_WORDING" | "FABRICATED_STATEMENT" | "CROSS_TENANT_EVIDENCE" | "INTEGRITY_FAILURE" | "ADVISORY_ONLY_VIOLATION";
export type NarrativeFailure = "DECISION_RECORD_INCOMPLETE" | "EVIDENCE_REFERENCES_MISSING" | "SELECTED_PLAN_UNDEFINED" | "REJECTED_ALTERNATIVES_UNDOCUMENTED" | "GOVERNANCE_REFERENCES_ABSENT" | "CONSTITUTIONAL_VALIDATION_UNAVAILABLE" | "AUTHORITY_APPROVAL_MISSING" | "CONFIDENCE_RISK_UNREPRODUCIBLE" | "REPLAY_REFERENCE_INVALID" | "DETERMINISTIC_WORDING_FAILED" | "FABRICATED_STATEMENT_DETECTED" | "CROSS_TENANT_EVIDENCE_DETECTED" | "INTEGRITY_VERIFICATION_FAILED" | "ADVISORY_ONLY_VIOLATION";

export type NarrativeSection = Readonly<{
  section_id: string;
  title: string;
  body: string;
  evidence_references: readonly string[];
  section_hash: string;
}>;

export type DecisionNarrative = Readonly<{
  narrative_id: string;
  explanation_id: string;
  decision_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  narrative_type: NarrativeType;
  narrative_state: NarrativeState;
  narrative_version: "decision-narrative/v8ALT.5.2";
  template_version: "narrative-template/v8ALT.5.2";
  timestamp: string;
  engine_version: "decision-narrative-engine/v8ALT.5.2";
  sections: readonly NarrativeSection[];
  rendered_text: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  source_explanation: ExplanationRecord;
  advisory_only: true;
  plan_modified: boolean;
  execution_modified: boolean;
  evidence_modified: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  fabricated_statement_detected: boolean;
  narrative_hash: string;
}>;

export type DecisionNarrativeRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  narratives: readonly DecisionNarrative[];
  append_only: true;
  repository_hash: string;
}>;

export type DecisionNarrativeInput = Readonly<{
  scenario?: NarrativeScenario;
  tenant_id?: string;
  mission_id?: string;
  explanation?: ExplanationRecord;
}>;

export type DecisionNarrativeValidationResult = Readonly<{
  narrative_id: string | null;
  valid: boolean;
  narrative_complete: boolean;
  evidence_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  deterministic_wording_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  advisory_only_enforced: boolean;
  failures: readonly NarrativeFailure[];
  validation_hash: string;
}>;

export type DecisionNarrativeReplayResult = Readonly<{
  replay_reference: string;
  narrative_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type DecisionNarrativeObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  narrative_count: number;
  narrative_types: readonly NarrativeType[];
  advisory_only: true;
  repository_hash: string;
}>;

export type DecisionNarrativeEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "decision-narrative-engine/v8ALT.5.2";
    principles: readonly string[];
    narrative_types: readonly NarrativeType[];
    narrative_states: readonly NarrativeState[];
    source_explanation_types: readonly ExplanationType[];
    advisory_only: true;
  }>;
  repository: DecisionNarrativeRepository;
  validation: DecisionNarrativeValidationResult;
  replay: DecisionNarrativeReplayResult;
  observability: DecisionNarrativeObservabilitySurface;
}>;
