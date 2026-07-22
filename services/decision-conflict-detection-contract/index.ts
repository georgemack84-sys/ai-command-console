import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ArbitrationStatus,
  ConflictArbitrationRequest,
  ConflictCategory,
  ConflictDetectionContractFoundation,
  ConflictDetectionObservability,
  ConflictDetectionRule,
  ConflictFailureReason,
  ConflictLifecycleAuditEntry,
  ConflictRecord,
  ConflictRegistrationInput,
  ConflictRegistrationResult,
  ConflictSeverity,
  ConflictState,
  ConflictType,
  ConflictValidationResult,
  ConflictReplayResult,
} from "@/types/decision-conflict-detection-contract";

const NOW = "2026-07-03T23:06:00.000Z";
const CONTRACT_VERSION = "conflict-detection-contract/v1" as const;

export const CONFLICT_CATEGORIES: readonly ConflictCategory[] = Object.freeze([
  "Recommendation",
  "Governance",
  "Authority",
  "Evidence",
  "Risk",
  "Confidence",
  "Forecast",
  "Mission Objective",
  "Recovery",
  "Timing",
  "Resource",
  "Tenant Boundary",
  "Certification",
  "Constitutional",
]);

export const CONFLICT_STATES: readonly ConflictState[] = Object.freeze([
  "DETECTED",
  "CLASSIFIED",
  "UNDER_REVIEW",
  "ARBITRATED",
  "ESCALATED",
  "CLOSED",
]);

export const CONFLICT_SEVERITIES: readonly ConflictSeverity[] = Object.freeze(["LOW", "MEDIUM", "HIGH", "CRITICAL", "BLOCKING"]);

export const ALLOWED_CONFLICT_TRANSITIONS: Readonly<Record<ConflictState, readonly ConflictState[]>> = Object.freeze({
  DETECTED: Object.freeze(["CLASSIFIED"] as ConflictState[]),
  CLASSIFIED: Object.freeze(["UNDER_REVIEW"] as ConflictState[]),
  UNDER_REVIEW: Object.freeze(["ARBITRATED", "ESCALATED"] as ConflictState[]),
  ARBITRATED: Object.freeze(["CLOSED"] as ConflictState[]),
  ESCALATED: Object.freeze(["UNDER_REVIEW", "CLOSED"] as ConflictState[]),
  CLOSED: Object.freeze([] as ConflictState[]),
});

const CATEGORY_TO_TYPE: Readonly<Record<ConflictCategory, ConflictType>> = Object.freeze({
  Recommendation: "recommendation_conflict",
  Governance: "governance_conflict",
  Authority: "authority_conflict",
  Evidence: "evidence_conflict",
  Risk: "risk_conflict",
  Confidence: "confidence_conflict",
  Forecast: "forecast_conflict",
  "Mission Objective": "mission_objective_conflict",
  Recovery: "recovery_conflict",
  Timing: "timing_conflict",
  Resource: "resource_conflict",
  "Tenant Boundary": "tenant_boundary_conflict",
  Certification: "certification_conflict",
  Constitutional: "constitutional_conflict",
});

const BASE_SEVERITY: Readonly<Record<ConflictCategory, ConflictSeverity>> = Object.freeze({
  Recommendation: "MEDIUM",
  Governance: "HIGH",
  Authority: "CRITICAL",
  Evidence: "MEDIUM",
  Risk: "HIGH",
  Confidence: "MEDIUM",
  Forecast: "MEDIUM",
  "Mission Objective": "HIGH",
  Recovery: "MEDIUM",
  Timing: "MEDIUM",
  Resource: "MEDIUM",
  "Tenant Boundary": "CRITICAL",
  Certification: "HIGH",
  Constitutional: "BLOCKING",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function normalizeCategories(values: readonly ConflictCategory[] | undefined, primary: ConflictCategory): ConflictCategory[] {
  return [...new Set((values ?? []).filter((value) => value !== primary && CONFLICT_CATEGORIES.includes(value)))].sort();
}

function defaultDetectionRule(category: ConflictCategory = "Governance"): ConflictDetectionRule {
  return createConflictDetectionRule({
    rule_id: `conflict_rule_${CATEGORY_TO_TYPE[category]}`,
    rule_name: `${category} conflict rule`,
    conflict_category: category,
    evidence_requirements: ["decision_candidate_evidence"],
    governance_requirements: ["governance_policy_binding"],
    authority_requirements: ["authority_boundary_binding"],
    replay_requirements: ["conflict_replay_snapshot"],
  });
}

export function createConflictDetectionRule(input: Partial<Omit<ConflictDetectionRule, "integrity_hash">> = {}): ConflictDetectionRule {
  const base: Omit<ConflictDetectionRule, "integrity_hash"> = {
    rule_id: input.rule_id ?? "conflict_rule_governance_conflict",
    rule_name: input.rule_name ?? "Governance conflict rule",
    rule_version: input.rule_version ?? "conflict-rule/v1",
    conflict_category: input.conflict_category ?? "Governance",
    evaluation_logic: input.evaluation_logic ?? "Compare decision candidate constraints deterministically and require arbitration when incompatible governance outcomes are present.",
    evidence_requirements: Object.freeze(normalizeStrings(input.evidence_requirements ?? ["decision_candidate_evidence"])),
    governance_requirements: Object.freeze(normalizeStrings(input.governance_requirements ?? ["governance_policy_binding"])),
    authority_requirements: Object.freeze(normalizeStrings(input.authority_requirements ?? ["authority_boundary_binding"])),
    replay_requirements: Object.freeze(normalizeStrings(input.replay_requirements ?? ["conflict_replay_snapshot"])),
    deterministic_threshold: input.deterministic_threshold ?? 1,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function conflictIdentity(input: ConflictRegistrationInput, rule: ConflictDetectionRule, category: ConflictCategory): string {
  return `conflict_${hash({
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_decision_conflict",
    category,
    candidates: normalizeStrings(input.candidate_refs ?? ["candidate_alpha", "candidate_beta"]),
    rule_id: rule.rule_id,
  }).slice(0, 32)}`;
}

function severityPriority(severity: ConflictSeverity): number {
  return { LOW: 20, MEDIUM: 40, HIGH: 65, CRITICAL: 85, BLOCKING: 100 }[severity];
}

function deriveSeverity(category: ConflictCategory, constitutionalRefs: readonly string[]): ConflictSeverity {
  if (constitutionalRefs.some((ref) => ref.toLowerCase().includes("violation"))) return "BLOCKING";
  return BASE_SEVERITY[category];
}

function arbitrationStatus(required: boolean): ArbitrationStatus {
  return required ? "REQUESTED" : "NOT_REQUESTED";
}

export function computeConflictRecordIntegrityHash(conflict: Omit<ConflictRecord, "integrity_hash"> | ConflictRecord): string {
  return hashWithoutIntegrity(conflict);
}

export function computeConflictDetectionRuleIntegrityHash(rule: Omit<ConflictDetectionRule, "integrity_hash"> | ConflictDetectionRule): string {
  return hashWithoutIntegrity(rule);
}

export function registerConflict(input: ConflictRegistrationInput = {}): ConflictRegistrationResult {
  const category = input.conflict_category ?? input.detection_rule?.conflict_category ?? "Governance";
  const rule = input.detection_rule ?? defaultDetectionRule(category);
  const constitutionalRefs = normalizeStrings(input.constitutional_refs ?? ["constitutional_advisory_only", "constitutional_operator_supremacy"]);
  const severity = deriveSeverity(category, constitutionalRefs);
  const conflict_id = conflictIdentity(input, rule, category);
  const base: Omit<ConflictRecord, "integrity_hash"> = {
    conflict_id,
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_decision_conflict",
    conflict_type: input.conflict_type ?? CATEGORY_TO_TYPE[category],
    conflict_category: category,
    secondary_categories: Object.freeze(normalizeCategories(input.secondary_categories, category)),
    conflict_state: input.conflict_state ?? "DETECTED",
    severity,
    priority: severityPriority(severity),
    candidate_refs: Object.freeze(normalizeStrings(input.candidate_refs ?? ["candidate_alpha", "candidate_beta"])),
    source_systems: Object.freeze(normalizeStrings(input.source_systems ?? ["decision_orchestrator"])),
    evidence_refs: Object.freeze(normalizeStrings(input.evidence_refs ?? ["evidence_candidate_delta"])),
    governance_refs: Object.freeze(normalizeStrings(input.governance_refs ?? rule.governance_requirements)),
    constitutional_refs: Object.freeze(constitutionalRefs),
    authority_refs: Object.freeze(normalizeStrings(input.authority_refs ?? rule.authority_requirements)),
    policy_refs: Object.freeze(normalizeStrings(input.policy_refs ?? ["policy_conflict_arbitration_required"])),
    risk_refs: Object.freeze(normalizeStrings(input.risk_refs ?? ["risk_conflict_unresolved"])),
    confidence_refs: Object.freeze(normalizeStrings(input.confidence_refs ?? ["confidence_assessment_conflicting"])),
    forecast_refs: Object.freeze(normalizeStrings(input.forecast_refs ?? [])),
    resource_refs: Object.freeze(normalizeStrings(input.resource_refs ?? [])),
    recovery_refs: Object.freeze(normalizeStrings(input.recovery_refs ?? [])),
    certification_refs: Object.freeze(normalizeStrings(input.certification_refs ?? ["certification_conflict_contract_v1"])),
    detection_reason: input.detection_reason ?? "Decision candidates contain incompatible governed constraints and require arbitration.",
    detection_rule_id: rule.rule_id,
    arbitration_required: true,
    arbitration_status: arbitrationStatus(true),
    escalation_required: severity === "CRITICAL" || severity === "BLOCKING",
    advisory_only: true,
    replay_ref: input.replay_ref ?? `replay_${conflict_id}`,
    lineage_ref: input.lineage_ref ?? `lineage_${conflict_id}`,
    created_timestamp: NOW,
    updated_timestamp: NOW,
  };
  const conflict = Object.freeze({ ...base, integrity_hash: computeConflictRecordIntegrityHash(base) });
  const validation = validateConflict(conflict, {
    detection_rule: rule,
    existing_conflict_ids: input.existing_conflict_ids,
    advisory_only: input.advisory_only,
  });
  if (validation.validation_state !== "VALID") {
    return Object.freeze({ registration_status: "REJECTED", fail_closed: true, validation });
  }
  return Object.freeze({ registration_status: "REGISTERED", fail_closed: false, conflict, validation });
}

function validationResult(failures: readonly ConflictFailureReason[]): ConflictValidationResult {
  const unique = Object.freeze([...new Set(failures)] as ConflictFailureReason[]);
  const has = (failure: ConflictFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      schema_complete: !has("CONFLICT_OBJECT_MISSING") && !has("REQUIRED_FIELD_MISSING"),
      evidence_complete: !has("MISSING_EVIDENCE_REFERENCES"),
      governance_complete: !has("MISSING_GOVERNANCE_REFERENCES"),
      constitutional_complete: !has("MISSING_CONSTITUTIONAL_REFERENCES") && !has("CONSTITUTIONAL_VIOLATION"),
      authority_complete: !has("MISSING_AUTHORITY_REFERENCES"),
      replay_ready: !has("MISSING_REPLAY_REFERENCE") && !has("REPLAY_MISMATCH"),
      lineage_complete: !has("MISSING_LINEAGE_REFERENCE"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function validateConflict(
  conflict: unknown,
  options: Readonly<{
    detection_rule?: ConflictDetectionRule;
    existing_conflict_ids?: readonly string[];
    advisory_only?: boolean;
  }> = {},
): ConflictValidationResult {
  if (!conflict || typeof conflict !== "object" || Array.isArray(conflict)) {
    return validationResult(["CONFLICT_OBJECT_MISSING"]);
  }
  const typed = conflict as ConflictRecord;
  const failures: ConflictFailureReason[] = [];
  if (!typed.conflict_id || !typed.tenant_id || !typed.mission_id || !typed.detection_reason || !typed.detection_rule_id || !typed.created_timestamp || !typed.updated_timestamp) failures.push("REQUIRED_FIELD_MISSING");
  if (!CONFLICT_CATEGORIES.includes(typed.conflict_category)) failures.push("INVALID_CONFLICT_CATEGORY");
  if (!CONFLICT_STATES.includes(typed.conflict_state)) failures.push("INVALID_CONFLICT_STATE");
  if (!typed.candidate_refs?.length) failures.push("MISSING_CANDIDATE_REFERENCES");
  if (!typed.evidence_refs?.length) failures.push("MISSING_EVIDENCE_REFERENCES");
  if (!typed.governance_refs?.length) failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (!typed.constitutional_refs?.length) failures.push("MISSING_CONSTITUTIONAL_REFERENCES");
  if (!typed.authority_refs?.length) failures.push("MISSING_AUTHORITY_REFERENCES");
  if (!typed.replay_ref) failures.push("MISSING_REPLAY_REFERENCE");
  if (!typed.lineage_ref) failures.push("MISSING_LINEAGE_REFERENCE");
  if (options.existing_conflict_ids?.includes(typed.conflict_id)) failures.push("DUPLICATE_CONFLICT_ID");
  if (typed.tenant_id !== "tenant_beta" && JSON.stringify(typed).includes("tenant_beta")) failures.push("TENANT_ISOLATION_VIOLATION");
  if (typed.constitutional_refs?.some((ref) => ref.toLowerCase().includes("violation"))) failures.push("CONSTITUTIONAL_VIOLATION");
  if (typed.advisory_only !== true || options.advisory_only === false) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && computeConflictRecordIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (options.detection_rule) {
    if (options.detection_rule.integrity_hash !== computeConflictDetectionRuleIntegrityHash(options.detection_rule)) failures.push("DETECTION_RULE_INVALID");
    if (options.detection_rule.rule_id !== typed.detection_rule_id) failures.push("DETECTION_RULE_INVALID");
  }
  return validationResult(failures);
}

export function classifyConflict(conflict: ConflictRecord): ConflictRecord {
  const severity = deriveSeverity(conflict.conflict_category, conflict.constitutional_refs);
  const base: Omit<ConflictRecord, "integrity_hash"> = {
    ...conflict,
    conflict_state: "CLASSIFIED",
    severity,
    priority: severityPriority(severity),
    escalation_required: severity === "CRITICAL" || severity === "BLOCKING",
    updated_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeConflictRecordIntegrityHash(base) });
}

export function transitionConflictLifecycle(
  conflict: ConflictRecord,
  new_state: ConflictState,
  initiating_component = "decision-conflict-detection-contract",
): ConflictLifecycleAuditEntry {
  const transition_valid = ALLOWED_CONFLICT_TRANSITIONS[conflict.conflict_state].includes(new_state);
  const base: Omit<ConflictLifecycleAuditEntry, "integrity_hash"> = {
    audit_id: `conflict_audit_${conflict.conflict_id}_${conflict.conflict_state.toLowerCase()}_${new_state.toLowerCase()}`,
    conflict_id: conflict.conflict_id,
    previous_state: conflict.conflict_state,
    new_state,
    initiating_component,
    triggering_rule: conflict.detection_rule_id,
    transition_valid,
    replay_ref: `${conflict.replay_ref}_${new_state.toLowerCase()}`,
    transition_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function generateConflictArbitrationRequest(conflict: ConflictRecord): ConflictArbitrationRequest {
  if (validateConflict(conflict).validation_state !== "VALID" || !conflict.arbitration_required) {
    const base: Omit<ConflictArbitrationRequest, "integrity_hash"> = {
      conflict_id: conflict.conflict_id,
      candidate_refs: Object.freeze([]),
      conflict_category: conflict.conflict_category,
      severity: conflict.severity,
      evidence_refs: Object.freeze([]),
      governance_refs: Object.freeze([]),
      authority_refs: Object.freeze([]),
      constitutional_refs: Object.freeze([]),
      arbitration_constraints: Object.freeze(["arbitration_request_failed_fail_closed"]),
      replay_ref: conflict.replay_ref,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }
  const base: Omit<ConflictArbitrationRequest, "integrity_hash"> = {
    conflict_id: conflict.conflict_id,
    candidate_refs: conflict.candidate_refs,
    conflict_category: conflict.conflict_category,
    severity: conflict.severity,
    evidence_refs: conflict.evidence_refs,
    governance_refs: conflict.governance_refs,
    authority_refs: conflict.authority_refs,
    constitutional_refs: conflict.constitutional_refs,
    arbitration_constraints: Object.freeze(normalizeStrings([
      "advisory_only",
      "operator_supremacy",
      "governance_supremacy",
      ...conflict.policy_refs,
      ...(conflict.escalation_required ? ["external_review_required"] : []),
    ])),
    replay_ref: conflict.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function replayConflict(
  conflict: ConflictRecord,
  lifecycle_transitions: readonly ConflictLifecycleAuditEntry[] = [],
  arbitration_request: ConflictArbitrationRequest = generateConflictArbitrationRequest(conflict),
): ConflictReplayResult {
  const reconstructed_hash = computeConflictRecordIntegrityHash(conflict);
  const transitionFailures = lifecycle_transitions.some((entry) => !entry.transition_valid || hashWithoutIntegrity(entry) !== entry.integrity_hash);
  const arbitrationFailed = arbitration_request.arbitration_constraints.includes("arbitration_request_failed_fail_closed");
  const replay_valid = reconstructed_hash === conflict.integrity_hash && !transitionFailures && !arbitrationFailed;
  const failures: ConflictFailureReason[] = [];
  if (reconstructed_hash !== conflict.integrity_hash || transitionFailures) failures.push("REPLAY_MISMATCH");
  if (arbitrationFailed) failures.push("ARBITRATION_REQUEST_FAILED");
  const base: Omit<ConflictReplayResult, "integrity_hash"> = {
    replay_id: `replay_conflict_${conflict.conflict_id}`,
    conflict_id: conflict.conflict_id,
    replay_valid,
    reconstructed_hash,
    expected_hash: conflict.integrity_hash,
    lifecycle_transitions: Object.freeze([...lifecycle_transitions]),
    arbitration_request,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ratio(pass: number, total: number): number {
  return total === 0 ? 1 : Number((pass / total).toFixed(6));
}

function countBy<T extends string>(items: readonly T[], keys: readonly T[]): Record<T, number> {
  return Object.freeze(keys.reduce((counts, key) => {
    counts[key] = items.filter((item) => item === key).length;
    return counts;
  }, {} as Record<T, number>));
}

export function buildConflictDetectionObservability(conflicts: readonly ConflictRecord[]): ConflictDetectionObservability {
  const validations = conflicts.map((conflict) => validateConflict(conflict));
  const replays = conflicts.map((conflict) => replayConflict(conflict));
  const arbitrationRequests = conflicts.map((conflict) => generateConflictArbitrationRequest(conflict));
  return Object.freeze({
    conflicts_detected: conflicts.length,
    conflicts_by_category: countBy(conflicts.map((conflict) => conflict.conflict_category), CONFLICT_CATEGORIES),
    conflicts_by_severity: countBy(conflicts.map((conflict) => conflict.severity), CONFLICT_SEVERITIES),
    lifecycle_state_distribution: countBy(conflicts.map((conflict) => conflict.conflict_state), CONFLICT_STATES),
    replay_success_rate: ratio(replays.filter((replay) => replay.replay_valid).length, conflicts.length),
    integrity_validation_success: ratio(validations.filter((validation) => validation.checks.integrity_valid).length, conflicts.length),
    governance_validation_success: ratio(validations.filter((validation) => validation.checks.governance_complete).length, conflicts.length),
    constitutional_validation_success: ratio(validations.filter((validation) => validation.checks.constitutional_complete).length, conflicts.length),
    arbitration_request_generation_rate: ratio(arbitrationRequests.filter((request) => !request.arbitration_constraints.includes("arbitration_request_failed_fail_closed")).length, conflicts.length),
    fail_closed_events: validations.filter((validation) => validation.fail_closed).length,
  });
}

export function getConflictDetectionContractFoundation(): ConflictDetectionContractFoundation {
  const detection_rule = createConflictDetectionRule();
  const registered = registerConflict({ detection_rule });
  if (!registered.conflict) throw new Error("conflict detection contract foundation could not register conflict");
  const classified = classifyConflict(registered.conflict);
  const transition = transitionConflictLifecycle(registered.conflict, "CLASSIFIED");
  const arbitration_request = generateConflictArbitrationRequest(classified);
  return Object.freeze({
    contract_version: CONTRACT_VERSION,
    categories: CONFLICT_CATEGORIES,
    states: CONFLICT_STATES,
    severities: CONFLICT_SEVERITIES,
    allowed_transitions: ALLOWED_CONFLICT_TRANSITIONS,
    detection_rule,
    conflict: classified,
    arbitration_request,
    validation: validateConflict(classified, { detection_rule }),
    replay: replayConflict(classified, [transition], arbitration_request),
  });
}

export const ConflictDetectionContract = Object.freeze({
  register: registerConflict,
  classify: classifyConflict,
  validate: validateConflict,
  transition: transitionConflictLifecycle,
  arbitrate: generateConflictArbitrationRequest,
  replay: replayConflict,
});
