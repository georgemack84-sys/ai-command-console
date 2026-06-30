import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildTaskClassificationPackage, computeTaskClassificationDecisionHash } from "@/services/task-classification-engine";
import type {
  AuthorityDomainResult,
  AuthorityValidationDecision,
  AuthorityValidationEvidence,
  AuthorityValidationFailureReason,
  AuthorityValidationFramework,
  AuthorityValidationPackage,
  AuthorityValidationReplayResult,
  AuthorityValidationResult,
  AuthorityValidationScenario,
  AuthorityValidationState,
  AuthorityValidationVisibilitySurface,
} from "@/types/authority-validation-engine";
import type { TaskClassificationPackage, TaskClassificationScenario } from "@/types/task-classification-engine";

const NOW = "2026-06-29T15:00:00.000Z";
const ENGINE_VERSION = "authority-validation-engine/v8D.3" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function classificationScenarioFor(scenario: AuthorityValidationScenario): TaskClassificationScenario {
  if (scenario === "BLOCKED_CLASSIFICATION") return "AUTHORITY_FAILURE";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "POLICY_CONFLICT") return "POLICY_CONFLICT";
  if (scenario === "TENANT_ISOLATION_FAILURE") return "CROSS_TENANT_ROUTING";
  if (scenario === "REPLAY_INCONSISTENCY") return "REPLAY_INCONSISTENCY";
  if (scenario === "INTEGRITY_FAILURE") return "HASH_MISMATCH";
  if (scenario === "OPERATOR_APPROVAL_REQUIRED" || scenario === "MISSING_APPROVAL") return "OPERATOR_REQUIRED";
  return "BASELINE";
}

function failureForScenario(scenario: AuthorityValidationScenario): AuthorityValidationFailureReason | null {
  const map: Partial<Record<AuthorityValidationScenario, AuthorityValidationFailureReason>> = {
    BLOCKED_CLASSIFICATION: "UNAUTHORIZED_DELEGATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION",
    UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION",
    MISSING_APPROVAL: "MISSING_APPROVAL",
    EXPIRED_CERTIFICATION: "EXPIRED_CERTIFICATION",
    INSUFFICIENT_CAPABILITY: "INSUFFICIENT_CAPABILITY",
    INADEQUATE_TRUST_SCORE: "INADEQUATE_TRUST_SCORE",
    POLICY_CONFLICT: "POLICY_CONFLICT",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    INCOMPLETE_VALIDATION_EVIDENCE: "INCOMPLETE_VALIDATION_EVIDENCE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
  };
  return map[scenario] ?? null;
}

function stateForFailure(failure: AuthorityValidationFailureReason): AuthorityValidationState {
  if (failure === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (failure === "POLICY_CONFLICT") return "POLICY_FAILURE";
  if (failure === "EXPIRED_CERTIFICATION" || failure === "INSUFFICIENT_CAPABILITY" || failure === "INADEQUATE_TRUST_SCORE") return "CERTIFICATION_FAILURE";
  if (failure === "TENANT_ISOLATION_FAILURE") return "TENANT_VIOLATION";
  if (failure === "MISSING_APPROVAL" || failure === "OPERATOR_BYPASS" || failure === "UNAUTHORIZED_OVERRIDE" || failure === "PRIVILEGE_ESCALATION") return "AUTHORITY_FAILURE";
  if (failure === "REPLAY_INCONSISTENCY" || failure === "INCOMPLETE_VALIDATION_EVIDENCE" || failure === "INTEGRITY_FAILURE") return "FAILED";
  return "REJECTED";
}

function domainResult(input: {
  validation_id: string;
  domain: AuthorityDomainResult["domain"];
  passed: boolean;
  state: AuthorityValidationState;
  evidence_ref: string;
  rationale: string;
  failure_reason: AuthorityValidationFailureReason | null;
}): AuthorityDomainResult {
  const source = {
    domain_id: id("AVD", "authority-validation-domain-id", { validation: input.validation_id, domain: input.domain }),
    domain: input.domain,
    passed: input.passed,
    state: input.state,
    evidence_ref: input.evidence_ref,
    rationale: input.rationale,
    failure_reason: input.failure_reason,
  };
  return Object.freeze({ ...source, result_hash: hashValue("authority-validation-domain-result", source) });
}

function domainFailures(pkg: TaskClassificationPackage, scenario: AuthorityValidationScenario): readonly AuthorityValidationFailureReason[] {
  const failures: AuthorityValidationFailureReason[] = [];
  const forced = failureForScenario(scenario);
  if (forced) failures.push(forced);
  if (pkg.validation.validation_state === "FAIL") failures.push("INVALID_CLASSIFICATION");
  if (pkg.classification.classification === "BLOCKED") failures.push("UNAUTHORIZED_DELEGATION");
  if (pkg.classification.authority_validation.failures.includes("MISSING_AUTHORITY")) failures.push("UNAUTHORIZED_DELEGATION");
  if (pkg.classification.authority_validation.failures.includes("POLICY_CONFLICT")) failures.push("POLICY_CONFLICT");
  if (pkg.classification.authority_validation.failures.includes("CONSTITUTIONAL_VIOLATION")) failures.push("CONSTITUTIONAL_VIOLATION");
  if (pkg.classification.authority_validation.failures.includes("CROSS_TENANT_ROUTING")) failures.push("TENANT_ISOLATION_FAILURE");
  if (!pkg.classification.replay_reference || pkg.validation.failures.includes("REPLAY_INCONSISTENCY")) failures.push("REPLAY_INCONSISTENCY");
  if (computeTaskClassificationDecisionHash(pkg.classification) !== pkg.classification.integrity_hash || pkg.validation.failures.includes("INTEGRITY_HASH_MISMATCH")) failures.push("INTEGRITY_FAILURE");
  const delegation = pkg.source_delegation;
  if (delegation.authority.approval_required && !delegation.authority.approval_reference) failures.push("MISSING_APPROVAL");
  return unique(failures);
}

function buildDomainResults(validation_id: string, pkg: TaskClassificationPackage, failures: readonly AuthorityValidationFailureReason[], scenario: AuthorityValidationScenario): readonly AuthorityDomainResult[] {
  const has = (failure: AuthorityValidationFailureReason) => failures.includes(failure);
  const trustScore = scenario === "INADEQUATE_TRUST_SCORE" ? 0.42 : scenario === "EXPIRED_CERTIFICATION" ? 0.69 : 0.93;
  return freezeArray([
    domainResult({ validation_id, domain: "IDENTITY", passed: !has("INVALID_CLASSIFICATION"), state: "IDENTITY_VALIDATED", evidence_ref: pkg.classification.delegation_id, rationale: "Delegation and classification identity are bound.", failure_reason: has("INVALID_CLASSIFICATION") ? "INVALID_CLASSIFICATION" : null }),
    domainResult({ validation_id, domain: "CONSTITUTION", passed: !has("CONSTITUTIONAL_VIOLATION") && !has("GOVERNANCE_BYPASS") && !has("PRIVILEGE_ESCALATION"), state: has("CONSTITUTIONAL_VIOLATION") ? "CONSTITUTIONAL_VIOLATION" : "CONSTITUTION_VALIDATED", evidence_ref: pkg.classification.evidence.constitutional_reference, rationale: "Constitutional limits, governance supremacy, and autonomy boundaries are checked.", failure_reason: has("CONSTITUTIONAL_VIOLATION") ? "CONSTITUTIONAL_VIOLATION" : has("GOVERNANCE_BYPASS") ? "GOVERNANCE_BYPASS" : has("PRIVILEGE_ESCALATION") ? "PRIVILEGE_ESCALATION" : null }),
    domainResult({ validation_id, domain: "POLICY", passed: !has("POLICY_CONFLICT"), state: has("POLICY_CONFLICT") ? "POLICY_FAILURE" : "POLICY_VALIDATED", evidence_ref: pkg.classification.policy_references[0] ?? "", rationale: "Active governing policies and required controls are satisfied.", failure_reason: has("POLICY_CONFLICT") ? "POLICY_CONFLICT" : null }),
    domainResult({ validation_id, domain: "OPERATOR", passed: !has("MISSING_APPROVAL") && !has("OPERATOR_BYPASS") && !has("UNAUTHORIZED_OVERRIDE"), state: has("MISSING_APPROVAL") ? "AUTHORITY_FAILURE" : "AUTHORITY_VALIDATED", evidence_ref: pkg.source_delegation.authority.approval_reference ?? "", rationale: "Operator approvals and review requirements remain protected.", failure_reason: has("MISSING_APPROVAL") ? "MISSING_APPROVAL" : has("OPERATOR_BYPASS") ? "OPERATOR_BYPASS" : has("UNAUTHORIZED_OVERRIDE") ? "UNAUTHORIZED_OVERRIDE" : null }),
    domainResult({ validation_id, domain: "CERTIFICATION", passed: !has("EXPIRED_CERTIFICATION") && !has("INSUFFICIENT_CAPABILITY") && !has("INADEQUATE_TRUST_SCORE") && trustScore >= 0.7, state: has("EXPIRED_CERTIFICATION") || has("INSUFFICIENT_CAPABILITY") || has("INADEQUATE_TRUST_SCORE") ? "CERTIFICATION_FAILURE" : "CERTIFICATION_VALIDATED", evidence_ref: `certification:${pkg.classification.execution_owner_id}`, rationale: "Delegate certification, capability, authorization, operational status, and trust score are checked.", failure_reason: has("EXPIRED_CERTIFICATION") ? "EXPIRED_CERTIFICATION" : has("INSUFFICIENT_CAPABILITY") ? "INSUFFICIENT_CAPABILITY" : has("INADEQUATE_TRUST_SCORE") ? "INADEQUATE_TRUST_SCORE" : null }),
    domainResult({ validation_id, domain: "TENANT", passed: !has("TENANT_ISOLATION_FAILURE"), state: has("TENANT_ISOLATION_FAILURE") ? "TENANT_VIOLATION" : "TENANT_VALIDATED", evidence_ref: pkg.source_delegation.governance.tenant_isolation_reference, rationale: "Tenant authority, execution, replay, lineage, evidence, and governance separation are preserved.", failure_reason: has("TENANT_ISOLATION_FAILURE") ? "TENANT_ISOLATION_FAILURE" : null }),
    domainResult({ validation_id, domain: "GOVERNANCE", passed: !has("GOVERNANCE_BYPASS") && !has("UNAUTHORIZED_DELEGATION"), state: has("UNAUTHORIZED_DELEGATION") ? "BLOCKED" : "AUTHORIZED", evidence_ref: pkg.source_delegation.governance.governance_reference, rationale: "Governance retains final decision authority before delegation.", failure_reason: has("GOVERNANCE_BYPASS") ? "GOVERNANCE_BYPASS" : has("UNAUTHORIZED_DELEGATION") ? "UNAUTHORIZED_DELEGATION" : null }),
    domainResult({ validation_id, domain: "INTEGRITY", passed: !has("INTEGRITY_FAILURE") && !has("INCOMPLETE_VALIDATION_EVIDENCE"), state: has("INTEGRITY_FAILURE") || has("INCOMPLETE_VALIDATION_EVIDENCE") ? "FAILED" : "AUTHORIZED", evidence_ref: pkg.classification.integrity_hash, rationale: "Validation evidence is complete and immutable.", failure_reason: has("INTEGRITY_FAILURE") ? "INTEGRITY_FAILURE" : has("INCOMPLETE_VALIDATION_EVIDENCE") ? "INCOMPLETE_VALIDATION_EVIDENCE" : null }),
    domainResult({ validation_id, domain: "REPLAY", passed: !has("REPLAY_INCONSISTENCY"), state: has("REPLAY_INCONSISTENCY") ? "FAILED" : "AUTHORIZED", evidence_ref: pkg.classification.replay_reference, rationale: "Authority decision replay metadata is complete.", failure_reason: has("REPLAY_INCONSISTENCY") ? "REPLAY_INCONSISTENCY" : null }),
  ]);
}

function computeEvidenceHash(evidence: Omit<AuthorityValidationEvidence, "integrity_hash"> | AuthorityValidationEvidence): string {
  return hashValue("authority-validation-evidence", {
    evidence_id: evidence.evidence_id,
    authority_references: evidence.authority_references,
    constitutional_references: evidence.constitutional_references,
    governing_policies: evidence.governing_policies,
    operator_approvals: evidence.operator_approvals,
    certification_evidence: evidence.certification_evidence,
    trust_score: evidence.trust_score,
    validation_timestamp: evidence.validation_timestamp,
    decision_rationale: evidence.decision_rationale,
    replay_reference: evidence.replay_reference,
    lineage_reference: evidence.lineage_reference,
    domain_result_hashes: evidence.domain_result_hashes,
  });
}

function buildEvidence(validation_id: string, pkg: TaskClassificationPackage, domainResults: readonly AuthorityDomainResult[], decision: AuthorityValidationDecision, scenario: AuthorityValidationScenario): AuthorityValidationEvidence {
  const source = {
    evidence_id: id("AVE", "authority-validation-evidence-id", validation_id),
    authority_references: freezeArray([pkg.classification.authority_validation.authority_reference].filter(Boolean)),
    constitutional_references: freezeArray([pkg.classification.evidence.constitutional_reference].filter(Boolean)),
    governing_policies: freezeArray(pkg.classification.policy_references),
    operator_approvals: scenario === "MISSING_APPROVAL" ? freezeArray<string>([]) : freezeArray([pkg.source_delegation.authority.approval_reference ?? ""].filter(Boolean)),
    certification_evidence: freezeArray([`certification:${pkg.classification.execution_owner_id}`, `capability:${pkg.classification.evidence.agent_capability || pkg.classification.execution_owner_type}`]),
    trust_score: scenario === "INADEQUATE_TRUST_SCORE" ? 0.42 : scenario === "EXPIRED_CERTIFICATION" ? 0.69 : 0.93,
    validation_timestamp: NOW,
    decision_rationale: decision === "AUTHORIZED" ? "All authority validation domains passed deterministically." : "One or more authority validation domains failed and delegation is rejected.",
    replay_reference: scenario === "REPLAY_INCONSISTENCY" ? "" : `authority:${pkg.classification.replay_reference}`,
    lineage_reference: pkg.classification.lineage_reference,
    domain_result_hashes: freezeArray(domainResults.map((result) => result.result_hash)),
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-authority-evidence" : computeEvidenceHash(source) });
}

export function computeAuthorityValidationResultHash(result: Omit<AuthorityValidationResult, "result_hash"> | AuthorityValidationResult): string {
  return hashValue("authority-validation-result", {
    validation_id: result.validation_id,
    classification_id: result.classification_id,
    delegation_id: result.delegation_id,
    tenant_id: result.tenant_id,
    decision: result.decision,
    final_state: result.final_state,
    failures: result.failures,
    domain_hashes: result.domain_results.map((domain) => domain.result_hash),
    evidence_hash: result.evidence.integrity_hash,
  });
}

export function validateClassificationAuthority(input: { scenario?: AuthorityValidationScenario; classificationPackage?: TaskClassificationPackage } = {}): AuthorityValidationResult {
  const scenario = input.scenario ?? "BASELINE";
  const sourcePackage = input.classificationPackage ?? buildTaskClassificationPackage({ scenario: classificationScenarioFor(scenario) });
  const initialFailures = domainFailures(sourcePackage, scenario);
  const validation_id = id("AV", "authority-validation-id", { classification: sourcePackage.classification.classification_id, scenario });
  const domainResults = buildDomainResults(validation_id, sourcePackage, initialFailures, scenario);
  const failures = unique([...initialFailures, ...domainResults.map((domain) => domain.failure_reason).filter((item): item is AuthorityValidationFailureReason => Boolean(item))]);
  const decision: AuthorityValidationDecision = failures.length ? "REJECTED" : "AUTHORIZED";
  const evidence = buildEvidence(validation_id, sourcePackage, domainResults, decision, scenario);
  const evidenceValid = computeEvidenceHash(evidence) === evidence.integrity_hash;
  const finalFailures = evidenceValid ? failures : unique([...failures, "INTEGRITY_FAILURE"]);
  const finalDecision: AuthorityValidationDecision = finalFailures.length ? "REJECTED" : "AUTHORIZED";
  const finalState: AuthorityValidationState = finalDecision === "AUTHORIZED" ? "AUTHORIZED" : stateForFailure(finalFailures[0] ?? "UNAUTHORIZED_DELEGATION");
  const source = {
    validation_id,
    classification_id: sourcePackage.classification.classification_id,
    delegation_id: sourcePackage.classification.delegation_id,
    tenant_id: sourcePackage.classification.tenant_id,
    decision: finalDecision,
    final_state: finalState,
    failures: finalFailures,
    constitutional_authority_valid: !finalFailures.includes("CONSTITUTIONAL_VIOLATION") && !finalFailures.includes("GOVERNANCE_BYPASS") && !finalFailures.includes("PRIVILEGE_ESCALATION"),
    governance_authority_valid: !finalFailures.includes("GOVERNANCE_BYPASS") && !finalFailures.includes("UNAUTHORIZED_DELEGATION"),
    policy_compliance_valid: !finalFailures.includes("POLICY_CONFLICT"),
    operator_authority_valid: !finalFailures.includes("MISSING_APPROVAL") && !finalFailures.includes("OPERATOR_BYPASS") && !finalFailures.includes("UNAUTHORIZED_OVERRIDE"),
    agent_certification_valid: !finalFailures.includes("EXPIRED_CERTIFICATION") && !finalFailures.includes("INSUFFICIENT_CAPABILITY") && !finalFailures.includes("INADEQUATE_TRUST_SCORE"),
    tenant_isolation_valid: !finalFailures.includes("TENANT_ISOLATION_FAILURE"),
    integrity_valid: !finalFailures.includes("INTEGRITY_FAILURE") && !finalFailures.includes("INCOMPLETE_VALIDATION_EVIDENCE"),
    replay_valid: !finalFailures.includes("REPLAY_INCONSISTENCY"),
    governance_evidence_recorded: Boolean(evidence.integrity_hash && evidence.domain_result_hashes.length),
    domain_results: domainResults,
    evidence,
  };
  return Object.freeze({ ...source, result_hash: computeAuthorityValidationResultHash(source) });
}

export function replayAuthorityValidation(result: AuthorityValidationResult): AuthorityValidationReplayResult {
  const failures: AuthorityValidationFailureReason[] = [];
  if (computeAuthorityValidationResultHash(result) !== result.result_hash) failures.push("INTEGRITY_FAILURE");
  if (!result.evidence.replay_reference) failures.push("REPLAY_INCONSISTENCY");
  if (computeEvidenceHash(result.evidence) !== result.evidence.integrity_hash) failures.push("INTEGRITY_FAILURE");
  const source = {
    replay_id: id("AVR", "authority-validation-replay-id", result.validation_id),
    validation_id: result.validation_id,
    reconstructed_domain_states: freezeArray(result.domain_results.map((domain) => domain.state)),
    reconstructed_decision: result.decision,
    reconstructed_failures: result.failures,
    evidence_hash: result.evidence.integrity_hash,
    validation_state: failures.length ? "FAIL" as const : result.decision === "AUTHORIZED" ? "PASS" as const : "FAIL" as const,
    failure_reason: failures[0] ?? result.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("authority-validation-replay", source) });
}

export function buildAuthorityValidationPackage(input: { scenario?: AuthorityValidationScenario; classificationPackage?: TaskClassificationPackage } = {}): AuthorityValidationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_classification = input.classificationPackage ?? buildTaskClassificationPackage({ scenario: classificationScenarioFor(scenario) });
  const validation = validateClassificationAuthority({ scenario, classificationPackage: source_classification });
  const replay = replayAuthorityValidation(validation);
  const ledgerSource = {
    ledger_entry_id: id("AVL", "authority-validation-ledger-id", validation.validation_id),
    validation_id: validation.validation_id,
    decision: validation.decision,
    evidence_hash: validation.evidence.integrity_hash,
    result_hash: validation.result_hash,
    replay_hash: replay.replay_hash,
    append_only: true as const,
    recorded_at: NOW,
  };
  const ledger_entry = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("authority-validation-ledger-entry", ledgerSource) });
  const source = {
    package_id: id("AVP", "authority-validation-package-id", validation.validation_id),
    engine_version: ENGINE_VERSION,
    source_classification,
    validation,
    replay,
    ledger_entry,
    mapped_classification_failures: source_classification.validation.failures,
  };
  return Object.freeze({ ...source, package_hash: hashValue("authority-validation-package", source) });
}

export function buildAuthorityValidationVisibilitySurface(pkg = buildAuthorityValidationPackage()): AuthorityValidationVisibilitySurface {
  return Object.freeze({
    validation_id: pkg.validation.validation_id,
    classification_id: pkg.validation.classification_id,
    delegation_id: pkg.validation.delegation_id,
    decision: pkg.validation.decision,
    final_state: pkg.validation.final_state,
    failure_reasons: pkg.validation.failures,
    trust_score: pkg.validation.evidence.trust_score,
    replay_reference: pkg.validation.evidence.replay_reference,
    lineage_reference: pkg.validation.evidence.lineage_reference,
    integrity_status: pkg.validation.integrity_valid ? "VALID" : "INVALID",
  });
}

export function getAuthorityValidationFramework(): AuthorityValidationFramework {
  const pkg = buildAuthorityValidationPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["constitutional-authority", "governance-supremacy", "policy-compliant", "operator-protected", "certified-agent-only", "tenant-isolated", "privilege-contained", "deterministic", "replayable", "immutable-evidence"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["PENDING", "IDENTITY_VALIDATED", "CONSTITUTION_VALIDATED", "POLICY_VALIDATED", "AUTHORITY_VALIDATED", "CERTIFICATION_VALIDATED", "TENANT_VALIDATED", "AUTHORIZED", "BLOCKED", "REJECTED", "POLICY_FAILURE", "AUTHORITY_FAILURE", "CERTIFICATION_FAILURE", "TENANT_VIOLATION", "CONSTITUTIONAL_VIOLATION", "FAILED"] as const),
      decisions: freezeArray(["AUTHORIZED", "REJECTED"] as const),
    }),
    package: pkg,
    visibility: buildAuthorityValidationVisibilitySurface(pkg),
  });
}
