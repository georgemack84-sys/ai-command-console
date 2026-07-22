import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getExplanation, registerExplanation } from "@/services/explainability-contract";
import type { ExplanationRecord, ExplanationType } from "@/types/explainability-contract";
import type {
  DecisionNarrative,
  DecisionNarrativeEngineContract,
  DecisionNarrativeInput,
  DecisionNarrativeObservabilitySurface,
  DecisionNarrativeReplayResult,
  DecisionNarrativeRepository,
  DecisionNarrativeValidationResult,
  NarrativeFailure,
  NarrativeScenario,
  NarrativeSection,
  NarrativeType,
} from "@/types/decision-narrative-engine";

const NOW = "2026-07-13T10:00:00.000Z";
const VERSION = "decision-narrative-engine/v8ALT.5.2" as const;
const NARRATIVE_VERSION = "decision-narrative/v8ALT.5.2" as const;
const TEMPLATE_VERSION = "narrative-template/v8ALT.5.2" as const;
const TENANT_ID = "tenant:autonomy:primary";
const narrativeTypes = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "GOVERNANCE", "SUPERVISION", "RECOVERY", "PREDICTION"] as const);
const narrativeStates = Object.freeze(["DECISION_CREATED", "EVIDENCE_RETRIEVED", "POLICY_ANALYSIS", "CONSTITUTION_ANALYSIS", "AUTHORITY_ANALYSIS", "CONFIDENCE_ANALYSIS", "RISK_ANALYSIS", "NARRATIVE_ASSEMBLY", "FORMATTING", "VALIDATION", "TRUTH_LEDGER_REGISTRATION", "REJECTED"] as const);
const sourceTypes = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: NarrativeScenario): readonly NarrativeFailure[] {
  const map: Partial<Record<NarrativeScenario, NarrativeFailure>> = {
    INCOMPLETE_DECISION_RECORD: "DECISION_RECORD_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCES_MISSING",
    MISSING_SELECTED_PLAN: "SELECTED_PLAN_UNDEFINED",
    UNDOCUMENTED_REJECTED_ALTERNATIVES: "REJECTED_ALTERNATIVES_UNDOCUMENTED",
    MISSING_GOVERNANCE_REFERENCES: "GOVERNANCE_REFERENCES_ABSENT",
    MISSING_CONSTITUTIONAL_VALIDATION: "CONSTITUTIONAL_VALIDATION_UNAVAILABLE",
    MISSING_AUTHORITY_APPROVAL: "AUTHORITY_APPROVAL_MISSING",
    UNREPRODUCIBLE_CONFIDENCE_RISK: "CONFIDENCE_RISK_UNREPRODUCIBLE",
    INVALID_REPLAY_REFERENCE: "REPLAY_REFERENCE_INVALID",
    NONDETERMINISTIC_WORDING: "DETERMINISTIC_WORDING_FAILED",
    FABRICATED_STATEMENT: "FABRICATED_STATEMENT_DETECTED",
    CROSS_TENANT_EVIDENCE: "CROSS_TENANT_EVIDENCE_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function explanationFor(input: DecisionNarrativeInput, failures: readonly NarrativeFailure[]): ExplanationRecord {
  if (input.explanation) return input.explanation;
  const scenario = failures.includes("EVIDENCE_REFERENCES_MISSING") ? "MISSING_EVIDENCE" : failures.includes("SELECTED_PLAN_UNDEFINED") ? "MISSING_SELECTED_OPTION" : failures.includes("REJECTED_ALTERNATIVES_UNDOCUMENTED") ? "UNDOCUMENTED_REJECTED_OPTIONS" : failures.includes("GOVERNANCE_REFERENCES_ABSENT") ? "INCOMPLETE_POLICY_REFERENCES" : failures.includes("CONSTITUTIONAL_VALIDATION_UNAVAILABLE") ? "MISSING_CONSTITUTIONAL_REFERENCES" : failures.includes("AUTHORITY_APPROVAL_MISSING") ? "AUTHORITY_VALIDATION_FAILURE" : failures.includes("CONFIDENCE_RISK_UNREPRODUCIBLE") ? "MISSING_CONFIDENCE_REASONING" : failures.includes("REPLAY_REFERENCE_INVALID") ? "INVALID_REPLAY_REFERENCE" : failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "INTEGRITY_HASH_FAILURE" : failures.includes("CROSS_TENANT_EVIDENCE_DETECTED") ? "CROSS_TENANT_REFERENCE" : failures.includes("FABRICATED_STATEMENT_DETECTED") ? "FABRICATED_REASONING" : failures.includes("ADVISORY_ONLY_VIOLATION") ? "ADVISORY_ONLY_VIOLATION" : failures.includes("DECISION_RECORD_INCOMPLETE") ? "INCOMPLETE_DECISION_SUMMARY" : "BASELINE";
  return getExplanation(registerExplanation({ scenario, tenant_id: input.tenant_id, mission_id: input.mission_id }))!;
}

function narrativeType(type: ExplanationType): NarrativeType {
  if (type === "INTERVENTION") return "RECOVERY";
  if (type === "REPLAY") return "PREDICTION";
  if (type === "ORCHESTRATION") return "EXECUTION";
  return type as NarrativeType;
}

function section(title: string, body: string, evidence: readonly string[], narrativeId: string, order: number): NarrativeSection {
  const base = { section_id: id("DNS", "decision-narrative-section", { narrativeId, title, order }), title, body, evidence_references: freezeArray(evidence) };
  return Object.freeze({ ...base, section_hash: hashValue("decision-narrative-section", base) });
}

function sections(record: ExplanationRecord, narrativeId: string, failures: readonly NarrativeFailure[]): readonly NarrativeSection[] {
  const evidence = failures.includes("EVIDENCE_REFERENCES_MISSING") ? freezeArray<string>([]) : record.evidence_references;
  const selected = record.selected_option;
  const rejected = record.rejected_options.map((item) => `${item.option} was rejected because ${item.reason_for_rejection}; governance: ${item.governance_reason}; constitutional: ${item.constitutional_reason}.`).join(" ");
  return freezeArray([
    section("Objective", `Objective ${record.decision_summary.objective} produced result ${record.decision_summary.decision_result}.`, evidence, narrativeId, 1),
    section("Selected Plan", selected ? `Selected ${selected.option} because ${selected.selection_reason}; approval status ${selected.approval_status}.` : "", evidence, narrativeId, 2),
    section("Rejected Alternatives", rejected, evidence, narrativeId, 3),
    section("Execution Sequence", `Execution ${record.execution_id} follows plan ${record.plan_id} for decision ${record.decision_id}.`, evidence, narrativeId, 4),
    section("Governance Decision", `Policies ${record.policy_references.join(", ")} were evaluated with governance-visible evidence.`, evidence, narrativeId, 5),
    section("Authority Approval", `Required authority ${record.authority_references.required_authority} resolved as ${record.authority_references.authority_result} via ${record.authority_references.authority_chain.join(" > ")}.`, evidence, narrativeId, 6),
    section("Confidence And Risk", `Confidence ${record.confidence_reasoning?.confidence_score ?? 0}; operational risk ${record.risk_reasoning?.operational_risk ?? 1}; mitigation ${record.risk_reasoning?.mitigation_rationale ?? ""}.`, evidence, narrativeId, 7),
    section("Intervention History", "No autonomous intervention was executed; narrative remains advisory only.", evidence, narrativeId, 8),
  ]);
}

function computeNarrativeHash(narrative: Omit<DecisionNarrative, "narrative_hash"> | DecisionNarrative): string {
  const { narrative_hash: _hash, ...source } = narrative as DecisionNarrative;
  return hashValue("decision-narrative", source);
}

export function generateNarrative(input: DecisionNarrativeInput = {}): DecisionNarrativeRepository {
  const scenario = input.scenario ?? "BASELINE";
  const failures = failuresFor(scenario);
  const record = explanationFor(input, failures);
  const narrativeId = id("DN", "decision-narrative", { explanation: record.explanation_id, scenario });
  const builtSections = sections(record, narrativeId, failures);
  const rendered = failures.includes("DETERMINISTIC_WORDING_FAILED") ? `${builtSections.map((item) => item.body).join("\n")}\n${Date.now()}` : builtSections.map((item) => `${item.title}\n${item.body}`).join("\n\n");
  const base = {
    narrative_id: narrativeId,
    explanation_id: record.explanation_id,
    decision_id: record.decision_id,
    mission_id: record.mission_id,
    execution_id: record.execution_id,
    tenant_id: failures.includes("CROSS_TENANT_EVIDENCE_DETECTED") ? "external-tenant" : record.tenant_id,
    narrative_type: narrativeType(record.explanation_type),
    narrative_state: failures.length ? "REJECTED" as const : "TRUTH_LEDGER_REGISTRATION" as const,
    narrative_version: NARRATIVE_VERSION,
    template_version: TEMPLATE_VERSION,
    timestamp: NOW,
    engine_version: VERSION,
    sections: builtSections,
    rendered_text: failures.includes("FABRICATED_STATEMENT_DETECTED") ? `${rendered}\nUnsupported statement added.` : rendered,
    replay_reference: failures.includes("REPLAY_REFERENCE_INVALID") ? "" : `replay:decision-narrative:${narrativeId}`,
    lineage_reference: `lineage:decision-narrative:${narrativeId}`,
    integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "" : hashValue("decision-narrative-integrity", { sections: builtSections.map((item) => item.section_hash), explanation: record.explanation_hash }),
    source_explanation: record,
    advisory_only: true as const,
    plan_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("ADVISORY_ONLY_VIOLATION"),
    fabricated_statement_detected: failures.includes("FABRICATED_STATEMENT_DETECTED"),
  };
  const narrative = Object.freeze({ ...base, narrative_hash: computeNarrativeHash(base as Omit<DecisionNarrative, "narrative_hash">) });
  const repoBase = { repository_id: id("DNR", "decision-narrative-repository", { narrativeId, scenario }), tenant_id: narrative.tenant_id, mission_id: narrative.mission_id, narratives: freezeArray([narrative]), append_only: true as const };
  return Object.freeze({ ...repoBase, repository_hash: hashValue("decision-narrative-repository", repoBase) });
}

export function getNarrative(repository = generateNarrative(), narrative_id?: string): DecisionNarrative | null {
  return repository.narratives.find((item) => item.narrative_id === (narrative_id ?? repository.narratives[0]?.narrative_id)) ?? null;
}

export function validateNarrative(narrative?: DecisionNarrative | null): DecisionNarrativeValidationResult {
  if (!narrative) {
    const failures = freezeArray<NarrativeFailure>(["DECISION_RECORD_INCOMPLETE"]);
    const source = { narrative_id: null, valid: false, narrative_complete: false, evidence_valid: false, replay_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, deterministic_wording_valid: false, integrity_valid: false, tenant_isolated: false, advisory_only_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("decision-narrative-validation", source) });
  }
  const source_decision_complete = Boolean(narrative.source_explanation.decision_summary.objective && narrative.source_explanation.decision_summary.decision_result);
  const narrative_complete = Boolean(narrative.decision_id && narrative.mission_id && narrative.execution_id && source_decision_complete && narrative.sections.length >= 8 && narrative.rendered_text && narrative.sections.every((item) => item.body));
  const evidence_valid = narrative.sections.every((item) => item.evidence_references.length > 0);
  const replay_valid = Boolean(narrative.replay_reference);
  const governance_valid = narrative.source_explanation.policy_references.length > 0 && !narrative.governance_modified;
  const constitutional_valid = narrative.source_explanation.constitutional_references.length > 0;
  const authority_valid = narrative.source_explanation.authority_references.authority_result === "VALIDATED" && !narrative.authority_escalated;
  const deterministic_wording_valid = !narrative.rendered_text.includes("Unsupported statement added.") && !/\d{13}/.test(narrative.rendered_text);
  const integrity_valid = Boolean(narrative.integrity_hash) && computeNarrativeHash(narrative) === narrative.narrative_hash;
  const tenant_isolated = narrative.tenant_id.startsWith("tenant:") && narrative.tenant_id === narrative.source_explanation.tenant_id;
  const advisory_only_enforced = narrative.advisory_only && !narrative.plan_modified && !narrative.execution_modified && !narrative.evidence_modified && !narrative.governance_modified && !narrative.authority_escalated;
  const failures = unique([
    ...(!narrative_complete ? ["DECISION_RECORD_INCOMPLETE" as const, ...(!narrative.sections[1]?.body ? ["SELECTED_PLAN_UNDEFINED" as const] : []), ...(!narrative.sections[2]?.body ? ["REJECTED_ALTERNATIVES_UNDOCUMENTED" as const] : [])] : []),
    ...(!evidence_valid ? ["EVIDENCE_REFERENCES_MISSING" as const] : []),
    ...(!replay_valid ? ["REPLAY_REFERENCE_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_REFERENCES_ABSENT" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VALIDATION_UNAVAILABLE" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_APPROVAL_MISSING" as const] : []),
    ...(!deterministic_wording_valid ? [narrative.fabricated_statement_detected ? "FABRICATED_STATEMENT_DETECTED" as const : "DETERMINISTIC_WORDING_FAILED" as const] : []),
    ...(!narrative.source_explanation.confidence_reasoning || !narrative.source_explanation.risk_reasoning ? ["CONFIDENCE_RISK_UNREPRODUCIBLE" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_EVIDENCE_DETECTED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { narrative_id: narrative.narrative_id, valid, narrative_complete, evidence_valid, replay_valid, governance_valid, constitutional_valid, authority_valid, deterministic_wording_valid, integrity_valid, tenant_isolated, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("decision-narrative-validation", source) });
}

export function replayNarrative(narrative = getNarrative()): DecisionNarrativeReplayResult {
  const reconstructed_hash = narrative ? computeNarrativeHash(narrative) : "";
  const source = { replay_reference: narrative?.replay_reference ?? "", narrative_id: narrative?.narrative_id ?? "", deterministic: Boolean(narrative?.replay_reference) && reconstructed_hash === narrative?.narrative_hash, reconstructed_hash, original_hash: narrative?.narrative_hash ?? "" };
  return Object.freeze({ ...source, replay_result_hash: hashValue("decision-narrative-replay", source) });
}

export function buildDecisionNarrativeObservabilitySurface(repository = generateNarrative()): DecisionNarrativeObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, tenant_id: repository.tenant_id, mission_id: repository.mission_id, narrative_count: repository.narratives.length, narrative_types: freezeArray(repository.narratives.map((item) => item.narrative_type)), advisory_only: true, repository_hash: repository.repository_hash });
}

export function getDecisionNarrativeEngineContract(): DecisionNarrativeEngineContract {
  const repository = generateNarrative();
  const narrative = getNarrative(repository);
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-language-generation", "template-driven-narratives", "evidence-backed-statements", "replay-identical-wording", "governance-transparency", "constitutional-accountability", "authority-traceability", "operator-readable", "audit-ready", "advisory-only"]),
      narrative_types: narrativeTypes,
      narrative_states: narrativeStates,
      source_explanation_types: sourceTypes,
      advisory_only: true,
    }),
    repository,
    validation: validateNarrative(narrative),
    replay: replayNarrative(narrative),
    observability: buildDecisionNarrativeObservabilitySurface(repository),
  });
}
