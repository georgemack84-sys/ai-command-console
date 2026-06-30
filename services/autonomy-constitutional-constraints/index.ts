import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { initializeAutonomyState } from "@/services/autonomy-state-machine";
import { decideAutonomyAuthority } from "@/services/autonomy-authority";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { AutonomyAuthorityFailureReason } from "@/types/autonomy-authority";
import type {
  ConstitutionalDecisionLedger,
  ConstitutionalDecisionRecord,
  ConstitutionalDecisionState,
  ConstitutionalFailureReason,
  ConstitutionalFramework,
  ConstitutionalReplayResult,
  ConstitutionalRequest,
  ConstitutionalRuleCategory,
  ConstitutionalRuleEvaluation,
  ConstitutionalScenario,
  ConstitutionalValidationResult,
  ConstitutionalVisibilitySurface,
} from "@/types/autonomy-constitutional-constraints";

const NOW = "2026-06-29T01:00:00.000Z";
const RULE_ORDER: readonly ConstitutionalRuleCategory[] = Object.freeze(["MISSION", "GOVERNANCE", "POLICY", "OPERATOR", "TENANT", "REPLAY", "EVIDENCE", "AUDIT", "INTEGRITY"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function requestHashSource(request: Omit<ConstitutionalRequest, "integrity_hash"> | ConstitutionalRequest) {
  return {
    constitutional_request_id: request.constitutional_request_id,
    autonomy_id: request.autonomy_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    requested_action: request.requested_action,
    mission_constitution: request.mission_constitution,
    governance_constitution: request.governance_constitution,
    policy_version: request.policy_version,
    operator_reference: request.operator_reference,
    replay_reference: request.replay_reference,
    evidence_references: request.evidence_references,
    audit_reference: request.audit_reference,
    hidden_validation: request.hidden_validation,
    self_modification_attempt: request.self_modification_attempt,
    constitution_modification_attempt: request.constitution_modification_attempt,
    authority_decision_id: request.authority_decision.authority_decision_id,
  };
}

export function computeConstitutionalRequestHash(request: Omit<ConstitutionalRequest, "integrity_hash"> | ConstitutionalRequest): string {
  return hashValue("autonomy-constitutional-request", requestHashSource(request));
}

function decisionHashSource(decision: Omit<ConstitutionalDecisionRecord, "integrity_hash"> | ConstitutionalDecisionRecord) {
  return {
    constitutional_decision_id: decision.constitutional_decision_id,
    autonomy_id: decision.autonomy_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    evaluated_rules: decision.evaluated_rules,
    decision: decision.decision,
    denial_reason: decision.denial_reason,
    approving_authority: decision.approving_authority,
    replay_reference: decision.replay_reference,
    evidence_references: decision.evidence_references,
    audit_reference: decision.audit_reference,
    timestamp: decision.timestamp,
  };
}

export function computeConstitutionalDecisionHash(decision: Omit<ConstitutionalDecisionRecord, "integrity_hash"> | ConstitutionalDecisionRecord): string {
  return hashValue("autonomy-constitutional-decision", decisionHashSource(decision));
}

export function buildConstitutionalRequest(identity = generateAutonomyIdentity(), scenario: ConstitutionalScenario = "BASELINE"): ConstitutionalRequest {
  const state = initializeAutonomyState(identity);
  const authorityScenario =
    scenario === "AUTHORITY_ESCALATION" ? "AUTHORITY_ESCALATION" :
    scenario === "UNAUTHORIZED_EXECUTION" ? "UNAUTHORIZED_DELEGATION" :
    scenario === "GOVERNANCE_BYPASS" ? "GOVERNANCE_BYPASS" :
    scenario === "POLICY_BYPASS" ? "POLICY_VIOLATION" : "BASELINE";
  const authority = decideAutonomyAuthority(identity, state, authorityScenario);
  const base = {
    constitutional_request_id: `CCR-${hashValue("constitutional-request-id", { id: identity.primary.autonomy_id, scenario }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_beta" : identity.primary.tenant_id,
    mission_id: scenario === "UNAUTHORIZED_EXECUTION" ? "mission_external" : identity.primary.mission_id,
    requested_action: authority.request.requested_action,
    authority_request: authority.request,
    authority_decision: authority.decision,
    mission_constitution: scenario === "UNAUTHORIZED_EXECUTION" ? "" : "mission-constitution:v8A",
    governance_constitution: scenario === "GOVERNANCE_BYPASS" ? "" : "governance-constitution:v8A",
    policy_version: scenario === "POLICY_BYPASS" ? "" : "policy:v8A:active",
    operator_reference: scenario === "HIDDEN_AUTONOMY" ? "" : authority.request.operator_reference,
    replay_reference: scenario === "UNDOCUMENTED_EXECUTION" || scenario === "REPLAY_DIVERGENCE" ? "" : identity.primary.replay_reference,
    evidence_references: scenario === "MISSING_EVIDENCE" || scenario === "UNDOCUMENTED_EXECUTION" ? freezeArray<string>([]) : freezeArray(["evidence:constitutional-request", "evidence:authority-decision"]),
    audit_reference: scenario === "AUDIT_GAP" || scenario === "UNDOCUMENTED_EXECUTION" ? "" : `audit:${identity.primary.autonomy_id}`,
    hidden_validation: scenario === "HIDDEN_AUTONOMY",
    self_modification_attempt: scenario === "SELF_MODIFICATION",
    constitution_modification_attempt: scenario === "CONSTITUTION_MODIFICATION",
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_MISMATCH" ? "tampered-constitutional-request" : computeConstitutionalRequestHash(base) });
}

function rule(category: ConstitutionalRuleCategory, rule_name: string, failed: ConstitutionalFailureReason | null, evidence_reference: string | null): ConstitutionalRuleEvaluation {
  const source = { category, rule_name, result: failed ? "FAIL" as const : "PASS" as const, failure_reason: failed, evidence_reference };
  return Object.freeze({
    rule_id: `CCRULE-${hashValue("constitutional-rule-id", source).slice(0, 12).toUpperCase()}`,
    ...source,
    evaluation_hash: hashValue("constitutional-rule-evaluation", source),
  });
}

export function evaluateConstitutionalRules(identity: AutonomyIdentityRecord, request: ConstitutionalRequest): readonly ConstitutionalRuleEvaluation[] {
  const evaluations = [
    rule("MISSION", "mission constitution scope", !request.mission_constitution || request.mission_id !== identity.primary.mission_id ? "MISSION_SCOPE_VIOLATION" : null, request.evidence_references[0] ?? null),
    rule("GOVERNANCE", "governance constitution supremacy", !request.governance_constitution || request.authority_decision.denial_reason === "GOVERNANCE_BYPASS" ? "GOVERNANCE_BYPASS" : null, request.evidence_references[0] ?? null),
    rule("POLICY", "active policy compliance", !request.policy_version || request.authority_decision.denial_reason === "POLICY_EXPIRED" ? "POLICY_BYPASS" : null, request.evidence_references[0] ?? null),
    rule("OPERATOR", "operator supremacy", !request.operator_reference ? "OPERATOR_BYPASS" : null, request.evidence_references[1] ?? null),
    rule("TENANT", "tenant isolation", request.tenant_id !== identity.primary.tenant_id ? "CROSS_TENANT_ACCESS" : null, request.evidence_references[1] ?? null),
    rule("REPLAY", "replay readiness", !request.replay_reference ? "REPLAY_REFERENCE_MISSING" : null, request.replay_reference || null),
    rule("EVIDENCE", "evidence completeness", request.evidence_references.length === 0 ? "EVIDENCE_MISSING" : null, request.evidence_references[0] ?? null),
    rule("AUDIT", "audit readiness", !request.audit_reference ? "AUDIT_RECORD_MISSING" : null, request.audit_reference || null),
    rule("INTEGRITY", "integrity verification", computeConstitutionalRequestHash(request) !== request.integrity_hash ? "INTEGRITY_HASH_MISMATCH" : null, request.integrity_hash),
  ];
  const extraFailures: ConstitutionalRuleEvaluation[] = [];
  if (request.authority_decision.decision === "DENIED") extraFailures.push(rule("GOVERNANCE", "authority decision must be approved", mapAuthorityFailure(request.authority_decision.denial_reason), request.authority_decision.integrity_hash));
  if (request.hidden_validation) extraFailures.push(rule("AUDIT", "hidden validation rejected", "HIDDEN_AUTONOMY", request.audit_reference || null));
  if (request.self_modification_attempt) extraFailures.push(rule("INTEGRITY", "self modification rejected", "SELF_MODIFICATION", request.integrity_hash));
  if (request.constitution_modification_attempt) extraFailures.push(rule("INTEGRITY", "constitution modification rejected", "CONSTITUTION_MODIFICATION", request.integrity_hash));
  if (!request.replay_reference && request.authority_decision.replay_reference) extraFailures.push(rule("REPLAY", "replay divergence rejected", "REPLAY_DIVERGENCE", request.authority_decision.replay_reference));
  return freezeArray([...evaluations, ...extraFailures]);
}

function mapAuthorityFailure(reason: AutonomyAuthorityFailureReason | null): ConstitutionalFailureReason {
  if (reason === "AUTHORITY_ESCALATION") return "AUTHORITY_ESCALATION";
  if (reason === "UNAUTHORIZED_EXECUTION" || reason === "UNAUTHORIZED_DELEGATION") return "UNAUTHORIZED_EXECUTION";
  if (reason === "GOVERNANCE_BYPASS") return "GOVERNANCE_BYPASS";
  if (reason === "POLICY_EXPIRED" || reason === "POLICY_VIOLATION") return "POLICY_BYPASS";
  if (reason === "CROSS_TENANT_AUTHORITY") return "CROSS_TENANT_ACCESS";
  if (reason === "MISSION_SCOPE_VIOLATION") return "MISSION_SCOPE_VIOLATION";
  return "FAIL_CLOSED";
}

export function validateConstitutionalRequest(identity: AutonomyIdentityRecord, request: ConstitutionalRequest): ConstitutionalValidationResult {
  const evaluations = evaluateConstitutionalRules(identity, request);
  const failures = freezeArray(evaluations.flatMap((item) => item.failure_reason ? [item.failure_reason] : []));
  const has = (reason: ConstitutionalFailureReason) => failures.includes(reason);
  const decision: ConstitutionalDecisionState = failures.length ? "DENIED" : "APPROVED";
  const source = {
    autonomy_id: identity.primary.autonomy_id,
    decision,
    failures,
    evaluation_hashes: evaluations.map((item) => item.evaluation_hash),
  };
  return Object.freeze({
    validation_id: `CCV-${hashValue("constitutional-validation-id", source).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    validation_state: decision === "APPROVED" ? "PASS" : "FAIL",
    decision,
    failures,
    mission_validated: !has("MISSION_SCOPE_VIOLATION") && !has("UNAUTHORIZED_MISSION_ACTION") && !has("MISSION_RULE_CONFLICT"),
    governance_validated: !has("GOVERNANCE_BYPASS") && !has("GOVERNANCE_SUPPRESSION") && !has("GOVERNANCE_OVERRIDE"),
    policy_validated: !has("POLICY_BYPASS") && !has("INVALID_POLICY_VERSION") && !has("POLICY_CONFLICT"),
    operator_validated: !has("OPERATOR_BYPASS") && !has("AUTONOMOUS_APPROVAL_SUBSTITUTION") && !has("UNAUTHORIZED_OPERATOR"),
    tenant_isolated: !has("CROSS_TENANT_ACCESS") && !has("SHARED_EXECUTION_STATE") && !has("SHARED_EVIDENCE"),
    replay_ready: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    evidence_complete: !has("EVIDENCE_MISSING") && !has("EVIDENCE_UNVERIFIABLE"),
    audit_ready: !has("AUDIT_RECORD_MISSING") && !has("AUDIT_HISTORY_INCOMPLETE") && !has("HIDDEN_AUTONOMY"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("FORGED_APPROVAL") && !has("SELF_MODIFICATION") && !has("CONSTITUTION_MODIFICATION"),
    fail_closed: decision === "DENIED",
    validation_hash: hashValue("constitutional-validation", source),
  });
}

export function decideConstitutionalRequest(identity = generateAutonomyIdentity(), scenario: ConstitutionalScenario = "BASELINE") {
  const request = buildConstitutionalRequest(identity, scenario);
  const evaluations = evaluateConstitutionalRules(identity, request);
  const validation = validateConstitutionalRequest(identity, request);
  const base = {
    constitutional_decision_id: `CCD-${hashValue("constitutional-decision-id", { id: identity.primary.autonomy_id, scenario }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    evaluated_rules: evaluations,
    decision: validation.decision,
    denial_reason: validation.failures[0] ?? null,
    approving_authority: validation.decision === "APPROVED" ? "mission-constitution:v8A" : "fail-closed",
    replay_reference: request.replay_reference,
    evidence_references: request.evidence_references,
    audit_reference: request.audit_reference,
    timestamp: NOW,
  };
  const decision = Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_MISMATCH" ? "tampered-constitutional-decision" : computeConstitutionalDecisionHash(base) });
  return Object.freeze({ request, validation, decision });
}

export function buildConstitutionalDecisionLedger(decisions: readonly ConstitutionalDecisionRecord[]): ConstitutionalDecisionLedger {
  const first = decisions[0];
  const source = {
    ledger_id: `CCL-${hashValue("constitutional-ledger-id", decisions.map((item) => item.constitutional_decision_id)).slice(0, 12).toUpperCase()}`,
    autonomy_id: first?.autonomy_id ?? "",
    tenant_id: first?.tenant_id ?? "",
    mission_id: first?.mission_id ?? "",
    decisions: freezeArray(decisions),
    approvals: freezeArray(decisions.filter((item) => item.decision === "APPROVED")),
    denials: freezeArray(decisions.filter((item) => item.decision === "DENIED")),
    replay_references: uniq(decisions.map((item) => item.replay_reference)),
    evidence_references: uniq(decisions.flatMap((item) => item.evidence_references)),
    audit_references: uniq(decisions.map((item) => item.audit_reference)),
  };
  return Object.freeze({ ...source, ledger_hash: hashValue("constitutional-ledger", source) });
}

export function replayConstitutionalDecisions(ledger: ConstitutionalDecisionLedger): ConstitutionalReplayResult {
  const failures: ConstitutionalFailureReason[] = [];
  const order = ledger.decisions[0]?.evaluated_rules.map((item) => item.category) ?? [];
  for (const decision of ledger.decisions) {
    if (decision.evaluated_rules.some((item, index) => item.category !== RULE_ORDER[index] && index < RULE_ORDER.length)) failures.push("REPLAY_DIVERGENCE");
    if (!decision.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
    if (decision.evidence_references.length === 0) failures.push("EVIDENCE_MISSING");
    if (!decision.audit_reference) failures.push("AUDIT_RECORD_MISSING");
    if (!decision.integrity_hash || decision.integrity_hash.startsWith("tampered") || computeConstitutionalDecisionHash(decision) !== decision.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
    if (decision.tenant_id !== ledger.tenant_id) failures.push("CROSS_TENANT_ACCESS");
  }
  const source = {
    replay_id: `CCR-${hashValue("constitutional-replay-id", ledger.ledger_id).slice(0, 12).toUpperCase()}`,
    autonomy_id: ledger.autonomy_id,
    evaluation_order: freezeArray(order),
    reconstructed_decisions: freezeArray(ledger.decisions.map((item) => item.decision)),
    evidence_references: ledger.evidence_references,
    integrity_hashes: freezeArray(ledger.decisions.map((item) => item.integrity_hash)),
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("constitutional-replay", source) });
}

export function buildConstitutionalVisibilitySurface(ledger: ConstitutionalDecisionLedger): ConstitutionalVisibilitySurface {
  const decisions = ledger.decisions;
  const rules = decisions.flatMap((item) => item.evaluated_rules);
  return Object.freeze({
    autonomy_id: ledger.autonomy_id,
    rules_evaluated: freezeArray(rules),
    validation_results: freezeArray(decisions.map((item) => item.decision)),
    approval_path: uniq(decisions.map((item) => item.approving_authority)),
    denial_reasons: freezeArray(decisions.flatMap((item) => item.denial_reason ? [item.denial_reason] : [])),
    policy_influence: rules.find((item) => item.category === "POLICY")?.result ?? "PASS",
    governance_influence: rules.find((item) => item.category === "GOVERNANCE")?.result ?? "PASS",
    operator_approvals: uniq(decisions.map((item) => item.approving_authority)),
    replay_references: ledger.replay_references,
    evidence_chain: ledger.evidence_references,
    integrity_status: replayConstitutionalDecisions(ledger).validation_state === "PASS" ? "VALID" : "INVALID",
    audit_history: ledger.audit_references,
    hidden_decisions_visible: false,
  });
}

export function getConstitutionalConstraintsFramework(): ConstitutionalFramework {
  const identity = generateAutonomyIdentity();
  const approved = decideConstitutionalRequest(identity);
  const denied = decideConstitutionalRequest(identity, "GOVERNANCE_BYPASS");
  const ledger = buildConstitutionalDecisionLedger([approved.decision, denied.decision]);
  return Object.freeze({
    identity,
    request: approved.request,
    validation: approved.validation,
    decision: approved.decision,
    ledger,
    replay: replayConstitutionalDecisions(ledger),
    visibility: buildConstitutionalVisibilitySurface(ledger),
  });
}
