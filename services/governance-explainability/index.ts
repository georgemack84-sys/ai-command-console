import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeDecisionInfluence } from "@/services/decision-influence-analysis";
import { registerGovernanceLineage } from "@/services/governance-lineage";
import { reconstructPolicyLineage } from "@/services/policy-lineage-reconstruction";
import type {
  GovernanceExplainabilityEngineInput,
  GovernanceExplainabilityEngineResult,
  GovernanceExplanation,
  GovernanceExplanationErrorCode,
  GovernanceExplanationFailureReason,
  GovernanceExplanationLayer,
  GovernanceExplanationObservabilitySurface,
  GovernanceExplanationReplayRefs,
  GovernanceExplanationReplayResult,
  GovernanceExplanationScenario,
  GovernanceExplanationState,
  GovernanceExplanationValidationFailure,
  GovernanceExplanationValidationResult,
  GovernanceExplanationViews,
} from "@/types/governance-explainability";

const NOW = "2026-06-26T20:00:00.000Z";
const VERSION = "governance-explainability/v7G.4" as const;
const STATES: readonly GovernanceExplanationState[] = Object.freeze(["CREATED", "ASSEMBLED", "VALIDATED", "CERTIFIED", "SUPERSEDED", "ARCHIVED"]);
const ERROR_CODES: Readonly<Record<GovernanceExplanationFailureReason, GovernanceExplanationErrorCode>> = Object.freeze({
  MISSING_EXPLANATION_IDENTIFIER: "GEE-001",
  GOVERNANCE_OBJECT_NOT_FOUND: "GEE-002",
  LINEAGE_REFERENCE_MISSING: "GEE-003",
  POLICY_REFERENCE_MISSING: "GEE-004",
  EVIDENCE_REFERENCE_INCOMPLETE: "GEE-005",
  INFLUENCE_GRAPH_INCOMPLETE: "GEE-006",
  CONSTITUTIONAL_REFERENCE_MISSING: "GEE-007",
  CONFIDENCE_REFERENCE_MISSING: "GEE-008",
  REPLAY_METADATA_MISSING: "GEE-009",
  HIDDEN_INFLUENCE_DETECTED: "GEE-010",
  CROSS_TENANT_REFERENCE_DETECTED: "GEE-011",
  EXPLANATION_REPLAY_MISMATCH: "GEE-012",
  UNSUPPORTED_INFERENCE_ATTEMPTED: "GEE-013",
  IMMUTABLE_EXPLANATION_MODIFIED: "GEE-014",
  GOVERNANCE_EXPLANATION_VALIDATION_FAILED: "GEE-015",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function failure(reason: GovernanceExplanationFailureReason, field_path: string, message: string): GovernanceExplanationValidationFailure {
  return Object.freeze({ error_code: ERROR_CODES[reason], reason, field_path, message, fail_closed: true });
}

function layer(layer_type: GovernanceExplanationLayer["layer_type"], content: string, references: readonly string[]): GovernanceExplanationLayer {
  const source = { layer_id: `GEE-LAYER-${hashValue("governance-explanation-layer-id", { layer_type, content }).slice(0, 10).toUpperCase()}`, layer_type, content, references: uniq(references) };
  return Object.freeze({ ...source, layer_hash: hashValue("governance-explanation-layer", source) });
}

function replayRefs(source: Omit<GovernanceExplanation, "replay_refs" | "explanation_hash">): GovernanceExplanationReplayRefs {
  const explanation_hash = hashValue("governance-explanation-content", { summary: source.summary, detailed: source.detailed_explanation, technical: source.technical_trace });
  const summary_hash = hashValue("governance-explanation-summary", source.summary);
  const reasoning_hash = hashValue("governance-explanation-reasoning", source.layers);
  const references_hash = hashValue("governance-explanation-references", {
    policy: source.policy_references,
    evidence: source.evidence_references,
    risk: source.risk_references,
    compliance: source.compliance_references,
    authority: source.authority_references,
    escalation: source.escalation_references,
  });
  const formatting_hash = hashValue("governance-explanation-formatting", source.views);
  const ordering_hash = hashValue("governance-explanation-ordering", source.layers.map((item) => item.layer_type));
  return Object.freeze({
    replay_id: `GEE-REPLAY-${hashValue("governance-explanation-replay-id", source.explanation_id).slice(0, 10).toUpperCase()}`,
    explanation_hash,
    summary_hash,
    reasoning_hash,
    references_hash,
    formatting_hash,
    ordering_hash,
    replay_output_hash: hashValue("governance-explanation-replay-output", { explanation_hash, summary_hash, reasoning_hash, references_hash, formatting_hash, ordering_hash }),
  });
}

export function computeGovernanceExplanationHash(explanation: Omit<GovernanceExplanation, "explanation_hash"> | GovernanceExplanation): string {
  const { explanation_hash: _hash, ...source } = explanation as GovernanceExplanation;
  return hashValue("governance-explanation", source);
}

export function generateGovernanceExplanation(input: GovernanceExplainabilityEngineInput = {}): GovernanceExplanation {
  const scenario = input.scenario ?? "BASELINE";
  const governance = input.governance_lineage ?? registerGovernanceLineage();
  const policy = input.policy_lineage ?? reconstructPolicyLineage({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_conclusion_ref: governance.governance_object.object_identifier });
  const influence = input.decision_influence ?? analyzeDecisionInfluence({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_lineage: governance, policy_lineage: policy });
  const tenant_id = scenario === "CROSS_TENANT" ? input.tenant_id ?? governance.tenant_id : input.tenant_id ?? governance.tenant_id;
  const object_identifier = scenario === "MISSING_OBJECT" ? "" : governance.governance_object.object_identifier;
  const policyRefs = scenario === "MISSING_POLICY" ? Object.freeze([]) : uniq([...governance.references.policy_ids, ...policy.policy_history.map((item) => item.policy_id)]);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? Object.freeze([]) : uniq([...governance.references.evidence_ids, ...influence.explanation.evidence_basis]);
  const constitutionalRefs = scenario === "MISSING_CONSTITUTION" ? Object.freeze([]) : governance.references.constitutional_rule_ids;
  const lineage_reference = scenario === "MISSING_LINEAGE" ? "" : governance.governance_lineage_id;
  const confidence_reference = scenario === "MISSING_CONFIDENCE" ? "" : influence.confidence.confidence_hash;
  const replay_reference = scenario === "MISSING_REPLAY" ? "" : influence.replay_refs.replay_id;
  const summary = `Governance conclusion ${object_identifier || "unknown"} exists because constitutional, authority, policy, evidence, risk, compliance, recommendation, and escalation artifacts support the verified lineage.`;
  const detailed = [
    `Policies applied: ${policyRefs.join(", ")}.`,
    `Evidence supporting the conclusion: ${evidenceRefs.join(", ")}.`,
    `Risks identified: ${governance.references.risk_ids.join(", ")}.`,
    `Compliance findings: ${governance.references.compliance_ids.join(", ")}.`,
    `Authority path: ${governance.references.authority_ids.join(", ")}.`,
    `Escalation reasoning: ${governance.references.escalation_ids.join(", ")}.`,
  ].join(" ");
  const technical = [
    `lineage=${lineage_reference}`,
    `policy_reconstruction=${policy.reconstruction_id}`,
    `decision_influence=${influence.analysis_id}`,
    `influence_graph=${influence.replay_refs.influence_graph_hash}`,
    `truth=${governance.replay_metadata.truth_record_reference}`,
  ].join(" | ");
  const layers = Object.freeze([
    layer("EXECUTIVE_SUMMARY", summary, [lineage_reference, confidence_reference]),
    layer("DETAILED_REASONING", detailed, [...policyRefs, ...evidenceRefs, ...governance.references.risk_ids, ...governance.references.compliance_ids]),
    layer("TECHNICAL_TRACE", technical, [policy.reconstruction_id, influence.analysis_id, influence.replay_refs.analysis_output_hash]),
  ]);
  const views: GovernanceExplanationViews = Object.freeze({
    executive_view: Object.freeze({ summary, recommendation: object_identifier, confidence: `${influence.confidence.confidence_level}:${influence.confidence.confidence_score}`, key_policies: policyRefs.slice(0, 3) }),
    governance_view: Object.freeze({ policy_history: policy.policy_history.map((item) => item.policy_id), constitutional_rules: constitutionalRefs, authority_decisions: governance.references.authority_ids, governance_constraints: influence.influences.filter((item) => item.relationship_type === "CONSTRAINED_BY").map((item) => item.source_identifier) }),
    audit_view: Object.freeze({ evidence_chain: evidenceRefs, lineage_graph: [governance.root_lineage_id, governance.governance_lineage_id], influence_graph: influence.influence_graph.map((item) => item.edge_id), replay_references: [replay_reference, policy.replay_refs.replay_id, governance.replay_metadata.replay_id], integrity_hashes: [governance.lineage_hash, policy.reconstruction_hash, influence.analysis_hash] }),
    technical_view: Object.freeze({ identifiers: [governance.governance_lineage_id, policy.reconstruction_id, influence.analysis_id], dependency_graph: influence.dependencies.map((item) => item.edge_id), state_transitions: ["CREATED", "ASSEMBLED"], replay_metadata: [replay_reference, influence.replay_refs.analysis_output_hash], truth_ledger_references: uniq([governance.replay_metadata.truth_record_reference, ...policy.source_truth_records]) }),
  });
  const explanation_id = scenario === "MISSING_EXPLANATION_ID" ? "" : `GEE-7G4-${hashValue("governance-explanation-id", { object_identifier, tenant_id, scenario }).slice(0, 10).toUpperCase()}`;
  const source: Omit<GovernanceExplanation, "replay_refs" | "explanation_hash"> = {
    explanation_id,
    tenant_id,
    mission_id: input.mission_id ?? governance.mission_id,
    governance_object: scenario === "MISSING_OBJECT" ? "" : governance.governance_object.governance_object,
    object_identifier,
    lineage_reference,
    policy_references: policyRefs,
    evidence_references: evidenceRefs,
    risk_references: governance.references.risk_ids,
    compliance_references: governance.references.compliance_ids,
    authority_references: governance.references.authority_ids,
    escalation_references: governance.references.escalation_ids,
    summary,
    detailed_explanation: detailed,
    technical_trace: scenario === "MISSING_INFLUENCE_GRAPH" ? technical.replace(influence.replay_refs.influence_graph_hash, "") : technical,
    layers: scenario === "MISSING_INFLUENCE_GRAPH" ? Object.freeze(layers.slice(0, 2)) : layers,
    views,
    confidence_reference,
    replay_reference,
    truth_record_reference: governance.replay_metadata.truth_record_reference,
    source_governance_lineage_id: governance.governance_lineage_id,
    source_policy_reconstruction_id: policy.reconstruction_id,
    source_decision_influence_analysis_id: influence.analysis_id,
    inference_guard: Object.freeze({ verified_sources_only: true, unsupported_inference_detected: scenario === "UNSUPPORTED_INFERENCE", hidden_reasoning_detected: scenario === "HIDDEN_INFLUENCE" }),
    state: "ASSEMBLED",
    version: VERSION,
    created_timestamp: NOW,
  };
  const refs = replayRefs(source);
  const withReplay = Object.freeze({ ...source, replay_refs: scenario === "REPLAY_MISMATCH" ? Object.freeze({ ...refs, replay_output_hash: "tampered" }) : refs });
  const explanation = Object.freeze({ ...withReplay, explanation_hash: computeGovernanceExplanationHash(withReplay) });
  if (scenario === "IMMUTABLE_MUTATION") return Object.freeze({ ...explanation, created_timestamp: "2026-06-27T00:00:00.000Z" });
  if (scenario === "CROSS_TENANT") return Object.freeze({ ...explanation, evidence_references: Object.freeze([...explanation.evidence_references, "evidence_tenant_beta_cross_tenant"]) });
  return explanation;
}

export function explainRecommendation(explanation = generateGovernanceExplanation()) {
  return Object.freeze({ reason: explanation.summary, supporting_evidence: explanation.evidence_references, policies_applied: explanation.policy_references, risks_identified: explanation.risk_references, compliance_findings: explanation.compliance_references, confidence: explanation.confidence_reference, replay_reference: explanation.replay_reference });
}

export function explainGovernanceDecision(explanation = generateGovernanceExplanation()) {
  return Object.freeze({ summary: explanation.summary, authority: explanation.authority_references, constraints: explanation.views.governance_view.governance_constraints, technical_trace: explanation.technical_trace });
}

export function explainPolicyInfluence(explanation = generateGovernanceExplanation()) {
  return Object.freeze({ governing_policy: explanation.policy_references[0], policy_history: explanation.views.governance_view.policy_history, constitutional_authority: explanation.views.governance_view.constitutional_rules, dependency_chain: explanation.views.technical_view.dependency_graph });
}

export function explainRiskContribution(explanation = generateGovernanceExplanation()) {
  return Object.freeze({ risks: explanation.risk_references, evidence: explanation.evidence_references, policy_constraints: explanation.policy_references, governance_impact: explanation.summary, replay_reference: explanation.replay_reference });
}

export function explainEscalation(explanation = generateGovernanceExplanation()) {
  return Object.freeze({ escalation_trigger: explanation.escalation_references[0], policies: explanation.policy_references, authority: explanation.authority_references, routing: explanation.object_identifier, required_review: explanation.views.executive_view.confidence, replay_reference: explanation.replay_reference });
}

export function validateGovernanceExplanation(explanation: Partial<GovernanceExplanation> | undefined): GovernanceExplanationValidationResult {
  const errors: GovernanceExplanationValidationFailure[] = [];
  if (!explanation?.explanation_id) errors.push(failure("MISSING_EXPLANATION_IDENTIFIER", "explanation_id", "explanation identifier is required"));
  if (!explanation?.governance_object || !explanation.object_identifier) errors.push(failure("GOVERNANCE_OBJECT_NOT_FOUND", "governance_object", "governance object is required"));
  if (!explanation?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage reference is required"));
  if (!explanation?.policy_references?.length) errors.push(failure("POLICY_REFERENCE_MISSING", "policy_references", "policy references are required"));
  if (!explanation?.evidence_references?.length) errors.push(failure("EVIDENCE_REFERENCE_INCOMPLETE", "evidence_references", "evidence references are required"));
  if (!explanation?.layers?.some((item) => item.layer_type === "TECHNICAL_TRACE") || !explanation?.technical_trace?.includes("influence_graph=")) errors.push(failure("INFLUENCE_GRAPH_INCOMPLETE", "technical_trace", "influence graph trace is required"));
  if (!explanation?.views?.governance_view.constitutional_rules.length) errors.push(failure("CONSTITUTIONAL_REFERENCE_MISSING", "constitutional_rules", "constitutional references are required"));
  if (!explanation?.confidence_reference) errors.push(failure("CONFIDENCE_REFERENCE_MISSING", "confidence_reference", "confidence reference is required"));
  if (!explanation?.replay_reference || !explanation.replay_refs?.replay_output_hash) errors.push(failure("REPLAY_METADATA_MISSING", "replay_reference", "replay metadata is required"));
  if (explanation?.inference_guard?.hidden_reasoning_detected) errors.push(failure("HIDDEN_INFLUENCE_DETECTED", "inference_guard", "hidden reasoning detected"));
  if (canonicalizeConfidenceToString(explanation ?? {}).includes("tenant_beta")) errors.push(failure("CROSS_TENANT_REFERENCE_DETECTED", "tenant_id", "cross-tenant reference detected"));
  if (explanation?.replay_refs && explanation.replay_refs.replay_output_hash !== hashValue("governance-explanation-replay-output", {
    explanation_hash: explanation.replay_refs.explanation_hash,
    summary_hash: explanation.replay_refs.summary_hash,
    reasoning_hash: explanation.replay_refs.reasoning_hash,
    references_hash: explanation.replay_refs.references_hash,
    formatting_hash: explanation.replay_refs.formatting_hash,
    ordering_hash: explanation.replay_refs.ordering_hash,
  })) errors.push(failure("EXPLANATION_REPLAY_MISMATCH", "replay_refs.replay_output_hash", "explanation replay output mismatch"));
  if (explanation?.inference_guard?.unsupported_inference_detected || explanation?.inference_guard?.verified_sources_only !== true) errors.push(failure("UNSUPPORTED_INFERENCE_ATTEMPTED", "inference_guard", "unsupported inference attempted"));
  if (explanation?.created_timestamp && explanation.created_timestamp !== NOW) errors.push(failure("IMMUTABLE_EXPLANATION_MODIFIED", "created_timestamp", "immutable explanation timestamp mutation detected"));
  if (explanation?.explanation_hash && computeGovernanceExplanationHash(explanation as GovernanceExplanation) !== explanation.explanation_hash) errors.push(failure("IMMUTABLE_EXPLANATION_MODIFIED", "explanation_hash", "explanation hash mismatch"));
  const validation_state: GovernanceExplanationValidationResult["validation_state"] = errors.some((error) => error.reason === "CROSS_TENANT_REFERENCE_DETECTED")
    ? "TENANT_SCOPE_VIOLATION"
    : errors.some((error) => error.reason === "EXPLANATION_REPLAY_MISMATCH")
      ? "REPLAY_MISMATCH"
      : errors.some((error) => ["HIDDEN_INFLUENCE_DETECTED", "UNSUPPORTED_INFERENCE_ATTEMPTED", "IMMUTABLE_EXPLANATION_MODIFIED"].includes(error.reason))
        ? "CERTIFICATION_BLOCKED"
        : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    explanation_id: explanation?.explanation_id,
    validation_state,
    validator_version: "GOVERNANCE-EXPLAINABILITY-VALIDATOR-V1",
    checks: Object.freeze({
      identity_valid: !errors.some((error) => error.reason === "MISSING_EXPLANATION_IDENTIFIER"),
      object_present: !errors.some((error) => error.reason === "GOVERNANCE_OBJECT_NOT_FOUND"),
      lineage_complete: !errors.some((error) => error.reason === "LINEAGE_REFERENCE_MISSING"),
      policy_complete: !errors.some((error) => error.reason === "POLICY_REFERENCE_MISSING"),
      evidence_complete: !errors.some((error) => error.reason === "EVIDENCE_REFERENCE_INCOMPLETE"),
      influence_complete: !errors.some((error) => error.reason === "INFLUENCE_GRAPH_INCOMPLETE"),
      constitution_present: !errors.some((error) => error.reason === "CONSTITUTIONAL_REFERENCE_MISSING"),
      confidence_present: !errors.some((error) => error.reason === "CONFIDENCE_REFERENCE_MISSING"),
      replay_ready: !errors.some((error) => ["REPLAY_METADATA_MISSING", "EXPLANATION_REPLAY_MISMATCH"].includes(error.reason)),
      hidden_reasoning_absent: !errors.some((error) => error.reason === "HIDDEN_INFLUENCE_DETECTED"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_REFERENCE_DETECTED"),
      no_unsupported_inference: !errors.some((error) => error.reason === "UNSUPPORTED_INFERENCE_ATTEMPTED"),
      immutable: !errors.some((error) => error.reason === "IMMUTABLE_EXPLANATION_MODIFIED"),
      hash_valid: !errors.some((error) => error.field_path === "explanation_hash"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function verifyExplanationReplay(explanation: GovernanceExplanation): GovernanceExplanationReplayResult {
  const validation = validateGovernanceExplanation(explanation);
  const reconstructed_hash = computeGovernanceExplanationHash(explanation);
  const reproduced = validation.validation_state === "VALID" && reconstructed_hash === explanation.explanation_hash;
  return Object.freeze({ replay_id: explanation.replay_refs.replay_id, replay_state: reproduced ? "REPRODUCED" : explanation.replay_reference ? "MISMATCH" : "INCOMPLETE", reconstructed_hash, expected_hash: explanation.explanation_hash, explanation_id: explanation.explanation_id, failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "EXPLANATION_REPLAY_MISMATCH" });
}

export function runGovernanceExplainability(input: GovernanceExplainabilityEngineInput = {}): GovernanceExplainabilityEngineResult {
  const explanation = generateGovernanceExplanation(input);
  const validation = validateGovernanceExplanation(explanation);
  const replay = verifyExplanationReplay(explanation);
  return Object.freeze({ engine_id: hashValue("governance-explainability-engine", explanation.explanation_hash), explanation, validation, replay });
}

export function buildGovernanceExplanationObservabilitySurface(input: GovernanceExplainabilityEngineInput = {}): GovernanceExplanationObservabilitySurface {
  const result = runGovernanceExplainability(input);
  return Object.freeze({ explanation_id: result.explanation.explanation_id, object_identifier: result.explanation.object_identifier, state: result.explanation.state, layer_count: result.explanation.layers.length, replay_state: result.replay.replay_state, validation_failures: Object.freeze(result.validation.errors.map((error) => error.reason)), executive_summary: result.explanation.views.executive_view.summary, advisory_only_notice: "Governance explanations are advisory-only and are assembled only from verified governance artifacts." });
}

export function getGovernanceExplainabilityContract() {
  const result = runGovernanceExplainability();
  return Object.freeze({
    doctrine: Object.freeze({ principles: Object.freeze(["deterministic", "evidence-backed", "replayable", "explainable", "constitution-first", "policy-aware", "advisory-only", "immutable", "operator-centric", "fail-closed"]), supported_states: STATES, supported_layers: Object.freeze(["EXECUTIVE_SUMMARY", "DETAILED_REASONING", "TECHNICAL_TRACE"] as const), version: VERSION }),
    explanation: result.explanation,
    validation: result.validation,
    replay: result.replay,
  });
}
