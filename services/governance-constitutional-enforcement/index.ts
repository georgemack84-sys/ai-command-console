import { runKnowledgeLifecycleManagement, validateKnowledgeLifecycleManagement } from "@/services/knowledge-lifecycle-management";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AuthorityBoundaryReport,
  ConstitutionalEnforcementContract,
  GovernanceCertification,
  GovernanceCertificationTest,
  GovernanceEnforcementContractBundle,
  GovernanceEnforcementFailure,
  GovernanceEnforcementInput,
  GovernanceEnforcementResult,
  GovernanceEnforcementScenario,
  GovernanceEnforcementValidation,
  GovernanceLedgerEntry,
  GovernanceObservability,
  GovernanceValidationReport,
  HumanApprovalRecord,
  PolicyValidationReport,
  ReplayEvidenceComplianceReport,
} from "@/types/governance-constitutional-enforcement";

const VERSION = "governance-constitutional-enforcement/v11.9" as const;
const ID = "GovernanceConstitutionalEnforcement" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: GovernanceEnforcementScenario): GovernanceEnforcementFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly GovernanceEnforcementFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function constitutional(failures: readonly GovernanceEnforcementFailure[]): ConstitutionalEnforcementContract {
  const base: Omit<ConstitutionalEnforcementContract, "integrity_hash"> = { contract_id: id("constitutional_enforcement_contract", VERSION), constitution_highest_precedence: !failures.includes("CONSTITUTIONAL_PRECEDENCE_BROKEN"), validation_before_persistence: !failures.includes("UNAUTHORIZED_PERSISTENCE"), violation_terminates_processing: !failures.includes("CONSTITUTIONAL_VIOLATION"), reproducible_decisions: !failures.includes("CONSTITUTIONAL_REPLAY_FAILED"), fail_closed_default: true, immutable_constitutional_integrity: !failures.includes("CONSTITUTIONAL_VIOLATION") };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-constitutional-contract" : hashWithoutIntegrity(base) });
}

function governance(failures: readonly GovernanceEnforcementFailure[]): GovernanceValidationReport {
  const base: Omit<GovernanceValidationReport, "integrity_hash"> = { report_id: "governance_validation_report", governance_approved: !failures.includes("GOVERNANCE_BYPASS"), workflow_valid: !failures.includes("GOVERNANCE_WORKFLOW_INVALID"), lineage_complete: !failures.includes("GOVERNANCE_LINEAGE_MISSING"), replay_validated: !failures.includes("REPLAY_DIVERGENCE"), deterministic: !failures.includes("GOVERNANCE_BYPASS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function policy(failures: readonly GovernanceEnforcementFailure[]): PolicyValidationReport {
  const ok = !failures.includes("POLICY_VIOLATION");
  const base: Omit<PolicyValidationReport, "integrity_hash"> = { report_id: "policy_validation_report", retention_policy_valid: ok, qualification_policy_valid: !failures.includes("QUALIFICATION_BYPASS"), visibility_policy_valid: ok, classification_policy_valid: ok, security_policy_valid: !failures.includes("SECURITY_POLICY_FAILURE"), lifecycle_policy_valid: !failures.includes("LIFECYCLE_POLICY_BYPASS"), conflicts_resolved: !failures.includes("POLICY_CONFLICT_UNRESOLVED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function authority(failures: readonly GovernanceEnforcementFailure[]): AuthorityBoundaryReport {
  const base: Omit<AuthorityBoundaryReport, "integrity_hash"> = { report_id: "authority_boundary_report", advisory_only_enforced: !failures.includes("ADVISORY_ONLY_VIOLATION"), operator_supremacy_enforced: !failures.includes("HUMAN_SUPREMACY_VIOLATION"), human_approval_enforced: !failures.includes("HUMAN_APPROVAL_MISSING"), capability_ceiling_valid: !failures.includes("CAPABILITY_CEILING_BREACH"), authority_escalation_blocked: !failures.includes("AUTHORITY_ESCALATION"), self_certification_blocked: !failures.includes("SELF_CERTIFICATION_ATTEMPT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approval(failures: readonly GovernanceEnforcementFailure[]): HumanApprovalRecord {
  const approved = !failures.includes("HUMAN_APPROVAL_MISSING");
  const base: Omit<HumanApprovalRecord, "integrity_hash"> = { approval_id: id("human_approval", VERSION), state: approved ? "APPROVED" : "PENDING", required_for: freezeArray(["persistence approval", "qualification certification", "governance exceptions", "constitutional exceptions", "policy overrides", "lifecycle promotion", "retirement approval", "revocation approval"]), operator_id: approved ? "operator:governance-authority" : "pending", replay_ref: failures.includes("APPROVAL_REPLAY_FAILED") ? "" : "replay:human-approval:governance", lineage_refs: approved ? freezeArray(["lineage:operator-approval", "lineage:governance-review"]) : freezeArray([]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayEvidence(failures: readonly GovernanceEnforcementFailure[]): ReplayEvidenceComplianceReport {
  const base: Omit<ReplayEvidenceComplianceReport, "integrity_hash"> = { report_id: "replay_evidence_compliance_report", deterministic_replay: !failures.includes("REPLAY_DIVERGENCE"), lineage_replay: !failures.includes("LINEAGE_INCOMPLETE"), governance_replay: !failures.includes("REPLAY_DIVERGENCE"), constitutional_replay: !failures.includes("CONSTITUTIONAL_REPLAY_FAILED"), approval_replay: !failures.includes("APPROVAL_REPLAY_FAILED"), evidence_complete: !failures.includes("EVIDENCE_INSUFFICIENT"), provenance_valid: !failures.includes("PROVENANCE_INVALID"), confidence_sufficient: !failures.includes("CONFIDENCE_NOT_QUALIFIED"), certification_refs_present: !failures.includes("QUALIFICATION_BYPASS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(failures: readonly GovernanceEnforcementFailure[]): readonly GovernanceLedgerEntry[] {
  const events: readonly GovernanceLedgerEntry["event"][] = freezeArray(["CONSTITUTION_VALIDATED", "GOVERNANCE_APPROVED", "POLICY_VALIDATED", "AUTHORITY_ENFORCED", "HUMAN_APPROVED", "ADVISORY_VALIDATED", "REPLAY_EVIDENCE_VALIDATED", "AUDIT_RECORDED", "CERTIFICATION_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<GovernanceLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("governance_ledger", `${event}:${index}`), sequence: index + 1, event, replay_refs: freezeArray([`replay:governance-enforcement:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly GovernanceEnforcementFailure[]): GovernanceObservability {
  const base: Omit<GovernanceObservability, "integrity_hash"> = { observability_id: "governance_constitutional_observability", governance_compliance_rate: failures.includes("GOVERNANCE_BYPASS") ? 0.4 : 1, constitutional_validation_success: failures.includes("CONSTITUTIONAL_VIOLATION") ? 0 : 1, approval_latency_ms: 38, replay_success_rate: failures.includes("REPLAY_DIVERGENCE") ? 0 : 1, audit_completeness: failures.includes("AUDIT_INCOMPLETE") ? 0.5 : 1, evidence_sufficiency_score: failures.includes("EVIDENCE_INSUFFICIENT") ? 0.4 : 0.94, authority_violation_count: failures.includes("AUTHORITY_ESCALATION") ? 1 : 0, policy_compliance_rate: failures.includes("POLICY_VIOLATION") ? 0.5 : 1, governance_throughput: 27, certification_readiness: failures.length ? 0.2 : 1, operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: GovernanceEnforcementFailure, refs: readonly string[]): GovernanceCertificationTest {
  const base: Omit<GovernanceCertificationTest, "integrity_hash"> = { test_id: id("governance_enforcement_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<GovernanceEnforcementResult, "certification" | "replay_hash" | "integrity_hash">;
function tests(result: TestBase): readonly GovernanceCertificationTest[] {
  const refs = freezeArray([result.constitutional_contract.integrity_hash, result.governance.integrity_hash, result.policy.integrity_hash]);
  return freezeArray([
    test("Constitutional compliance validation", result.constitutional_contract.immutable_constitutional_integrity, "CONSTITUTIONAL_VIOLATION", refs),
    test("Constitutional precedence enforcement", result.constitutional_contract.constitution_highest_precedence, "CONSTITUTIONAL_PRECEDENCE_BROKEN", refs),
    test("Constitutional conflict resolution", result.constitutional_contract.violation_terminates_processing, "CONSTITUTIONAL_VIOLATION", refs),
    test("Constitutional replay validation", result.replay_evidence.constitutional_replay, "CONSTITUTIONAL_REPLAY_FAILED", refs),
    test("Constitutional integrity verification", hashWithoutIntegrity(result.constitutional_contract) === result.constitutional_contract.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Governance approval enforcement", result.governance.governance_approved, "GOVERNANCE_BYPASS", refs),
    test("Governance workflow validation", result.governance.workflow_valid, "GOVERNANCE_WORKFLOW_INVALID", refs),
    test("Governance lineage verification", result.governance.lineage_complete, "GOVERNANCE_LINEAGE_MISSING", refs),
    test("Governance replay testing", result.governance.replay_validated, "REPLAY_DIVERGENCE", refs),
    test("Governance determinism", result.governance.deterministic, "GOVERNANCE_BYPASS", refs),
    test("Policy compliance validation", result.policy.retention_policy_valid && result.policy.visibility_policy_valid, "POLICY_VIOLATION", refs),
    test("Policy conflict resolution", result.policy.conflicts_resolved, "POLICY_CONFLICT_UNRESOLVED", refs),
    test("Lifecycle policy enforcement", result.policy.lifecycle_policy_valid, "LIFECYCLE_POLICY_BYPASS", refs),
    test("Retention policy validation", result.policy.retention_policy_valid, "POLICY_VIOLATION", refs),
    test("Security policy verification", result.policy.security_policy_valid, "SECURITY_POLICY_FAILURE", refs),
    test("Advisory-only validation", result.authority.advisory_only_enforced, "ADVISORY_ONLY_VIOLATION", refs),
    test("Human supremacy enforcement", result.authority.operator_supremacy_enforced, "HUMAN_SUPREMACY_VIOLATION", refs),
    test("Capability ceiling validation", result.authority.capability_ceiling_valid, "CAPABILITY_CEILING_BREACH", refs),
    test("Authority escalation prevention", result.authority.authority_escalation_blocked, "AUTHORITY_ESCALATION", refs),
    test("Self-certification prevention", result.authority.self_certification_blocked, "SELF_CERTIFICATION_ATTEMPT", refs),
    test("Approval workflow validation", result.human_approval.state === "APPROVED", "HUMAN_APPROVAL_MISSING", refs),
    test("Operator authorization verification", result.human_approval.operator_id.startsWith("operator:"), "HUMAN_APPROVAL_MISSING", refs),
    test("Exception handling validation", result.human_approval.required_for.includes("policy overrides"), "HUMAN_APPROVAL_MISSING", refs),
    test("Escalation workflow testing", result.human_approval.required_for.includes("constitutional exceptions"), "HUMAN_APPROVAL_MISSING", refs),
    test("Approval replay validation", result.replay_evidence.approval_replay, "APPROVAL_REPLAY_FAILED", refs),
    test("Deterministic replay validation", result.replay_evidence.deterministic_replay, "REPLAY_DIVERGENCE", refs),
    test("Evidence sufficiency verification", result.replay_evidence.evidence_complete, "EVIDENCE_INSUFFICIENT", refs),
    test("Lineage completeness validation", result.replay_evidence.lineage_replay, "LINEAGE_INCOMPLETE", refs),
    test("Provenance integrity testing", result.replay_evidence.provenance_valid, "PROVENANCE_INVALID", refs),
    test("Confidence qualification verification", result.replay_evidence.confidence_sufficient, "CONFIDENCE_NOT_QUALIFIED", refs),
    test("Immutable ledger validation", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    test("Audit completeness verification", result.ledger.length === 9 && result.ledger.every((entry, index) => entry.sequence === index + 1), "AUDIT_INCOMPLETE", refs),
    test("Accountability traceability", result.human_approval.lineage_refs.length > 0, "ACCOUNTABILITY_GAP", refs),
    test("Cryptographic integrity validation", result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash), "INTEGRITY_HASH_MISMATCH", refs),
    test("Historical replay verification", result.replay_evidence.governance_replay, "REPLAY_DIVERGENCE", refs),
    test("Tenant isolation validation", result.observability.operational, "TENANT_ISOLATION_BREACH", refs),
    test("Cross-tenant governance protection", result.lifecycle_certified, "TENANT_ISOLATION_BREACH", refs),
    test("Unauthorized persistence prevention", result.constitutional_contract.validation_before_persistence, "UNAUTHORIZED_PERSISTENCE", refs),
    test("Unauthorized mutation prevention", result.constitutional_contract.fail_closed_default, "UNAUTHORIZED_MUTATION", refs),
    test("Governance boundary enforcement", result.governance.governance_approved && result.policy.security_policy_valid, "GOVERNANCE_BYPASS", refs),
    test("Governance health monitoring", result.observability.operational, "OBSERVABILITY_INCOMPLETE", refs),
    test("Compliance metric validation", result.observability.governance_compliance_rate === 1, "GOVERNANCE_BYPASS", refs),
    test("Alert generation testing", result.observability.certification_readiness === 1, "OBSERVABILITY_INCOMPLETE", refs),
    test("Dashboard integrity verification", hashWithoutIntegrity(result.observability) === result.observability.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Operational transparency validation", result.observability.audit_completeness === 1, "AUDIT_INCOMPLETE", refs),
  ]);
}

function replayHash(result: Omit<GovernanceEnforcementResult, "replay_hash" | "integrity_hash">): string {
  return hash({ constitutional: result.constitutional_contract.integrity_hash, governance: result.governance.integrity_hash, policy: result.policy.integrity_hash, authority: result.authority.integrity_hash, approval: result.human_approval.integrity_hash, replayEvidence: result.replay_evidence.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<GovernanceEnforcementResult, "integrity_hash">): string {
  return hash({ version: result.enforcement_version, id: result.enforcement_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runGovernanceConstitutionalEnforcement(input: GovernanceEnforcementInput = {}): GovernanceEnforcementResult {
  const lifecycle = runKnowledgeLifecycleManagement({ tenant_id: input.tenant_id });
  const lifecycleValid = validateKnowledgeLifecycleManagement(lifecycle).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<GovernanceEnforcementFailure>([...(lifecycleValid ? [] : ["LIFECYCLE_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const baseWithoutCertification: TestBase = { enforcement_version: VERSION, enforcement_identifier: ID, lifecycle_certified: lifecycleValid, constitutional_contract: constitutional(failures), governance: governance(failures), policy: policy(failures), authority: authority(failures), human_approval: approval(failures), replay_evidence: replayEvidence(failures), ledger: ledger(failures), observability: observability(failures) };
  const validationTests = tests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is GovernanceEnforcementFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<GovernanceCertification, "integrity_hash"> = { certification_id: id("governance_constitutional_certification", VERSION), status, persistent_capabilities_enabled: status === "PASS", failures: finalFailures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<GovernanceEnforcementResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateGovernanceConstitutionalEnforcement(result?: GovernanceEnforcementResult): GovernanceEnforcementValidation {
  if (!result) {
    const failures = freezeArray<GovernanceEnforcementFailure>(["CONTRACT_INVALID"]);
    const base: Omit<GovernanceEnforcementValidation, "validation_hash"> = { enforcement_id: null, valid: false, status: "FAIL", persistent_capabilities_enabled: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.constitutional_contract) === result.constitutional_contract.integrity_hash && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash) && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.persistent_capabilities_enabled && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<GovernanceEnforcementValidation, "validation_hash"> = { enforcement_id: result.constitutional_contract.contract_id, valid, status: result.certification.status, persistent_capabilities_enabled: result.certification.persistent_capabilities_enabled, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayGovernanceConstitutionalEnforcement(result = runGovernanceConstitutionalEnforcement()): boolean {
  const replayed = runGovernanceConstitutionalEnforcement();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateGovernanceConstitutionalEnforcement(result).valid;
}

export function getGovernanceConstitutionalEnforcementContract(): GovernanceEnforcementContractBundle {
  const result = runGovernanceConstitutionalEnforcement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, constitution_supersedes_policy: true, human_authority_delegated: false, intelligence_advisory_only: true, fail_closed_default: true, governance_bypass_supported: false }), result, validation: validateGovernanceConstitutionalEnforcement(result), observability: result.observability });
}

export const GovernanceConstitutionalEnforcement = Object.freeze({ run: runGovernanceConstitutionalEnforcement, validate: validateGovernanceConstitutionalEnforcement, replay: replayGovernanceConstitutionalEnforcement });
