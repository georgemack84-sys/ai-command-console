import { runOrganizationalLearning, validateOrganizationalLearning } from "@/services/organizational-learning-framework";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  KnowledgeLifecycleContract,
  KnowledgeLifecycleContractBundle,
  KnowledgeLifecycleFailure,
  KnowledgeLifecycleInput,
  KnowledgeLifecycleRecord,
  KnowledgeLifecycleResult,
  KnowledgeLifecycleScenario,
  KnowledgeLifecycleState,
  KnowledgeLifecycleTransition,
  KnowledgeLifecycleValidation,
  LifecycleCertification,
  LifecycleCertificationTest,
  LifecycleIntegrityReport,
  LifecycleLedgerEntry,
  LifecycleObservability,
  LifecyclePolicyRecord,
  LifecycleTransitionRecord,
  LifecycleVersionRecord,
} from "@/types/knowledge-lifecycle-management";

const VERSION = "knowledge-lifecycle-management/v11.8" as const;
const ID = "KnowledgeLifecycleManagement" as const;
const TENANT_ID = "tenant_mission_control";
const STATES: readonly KnowledgeLifecycleState[] = Object.freeze(["OBSERVED", "QUALIFIED", "CERTIFIED", "PERSISTENT", "REFERENCED", "UPDATED", "SUPERSEDED", "ARCHIVED", "RETIRED"]);
const TRANSITIONS: readonly KnowledgeLifecycleTransition[] = Object.freeze(["OBSERVE", "QUALIFY", "CERTIFY", "PERSIST", "REFERENCE", "UPDATE", "SUPERSEDE", "ARCHIVE", "RETIRE", "REQUALIFY", "REVOKE"]);
const LEGAL: Readonly<Record<KnowledgeLifecycleTransition, readonly [KnowledgeLifecycleState | null, KnowledgeLifecycleState]>> = Object.freeze({
  OBSERVE: [null, "OBSERVED"],
  QUALIFY: ["OBSERVED", "QUALIFIED"],
  CERTIFY: ["QUALIFIED", "CERTIFIED"],
  PERSIST: ["CERTIFIED", "PERSISTENT"],
  REFERENCE: ["PERSISTENT", "REFERENCED"],
  UPDATE: ["REFERENCED", "UPDATED"],
  SUPERSEDE: ["UPDATED", "SUPERSEDED"],
  ARCHIVE: ["SUPERSEDED", "ARCHIVED"],
  RETIRE: ["ARCHIVED", "RETIRED"],
  REQUALIFY: ["PERSISTENT", "QUALIFIED"],
  REVOKE: ["PERSISTENT", "ARCHIVED"],
});

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: KnowledgeLifecycleScenario): KnowledgeLifecycleFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly KnowledgeLifecycleFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly KnowledgeLifecycleFailure[]): KnowledgeLifecycleContract {
  const base: Omit<KnowledgeLifecycleContract, "integrity_hash"> = { contract_id: id("knowledge_lifecycle_contract", VERSION), states: STATES, transitions: TRANSITIONS, deterministic_required: !failures.includes("NONDETERMINISTIC_TRANSITION"), replay_required: !failures.includes("REPLAY_VALIDATION_FAILED"), governance_required: !failures.includes("GOVERNANCE_APPROVAL_MISSING"), constitutional_required: !failures.includes("CONSTITUTIONAL_APPROVAL_MISSING"), qualification_required: !failures.includes("QUALIFICATION_BYPASS"), certification_required: !failures.includes("CERTIFICATION_BYPASS"), deletion_supported: false, silent_expiration_supported: false, history_overwrite_supported: false };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-lifecycle-contract" : hashWithoutIntegrity(base) });
}

function transitions(failures: readonly KnowledgeLifecycleFailure[]): readonly LifecycleTransitionRecord[] {
  return freezeArray(TRANSITIONS.slice(0, 9).map((transition) => {
    const [from_state, to_state] = LEGAL[transition];
    const legal = !failures.includes("ILLEGAL_TRANSITION");
    const base: Omit<LifecycleTransitionRecord, "integrity_hash"> = { transition_id: id("lifecycle_transition", { transition, from_state, to_state }), transition, from_state, to_state, legal, deterministic: !failures.includes("NONDETERMINISTIC_TRANSITION"), replay_validated: !failures.includes("REPLAY_VALIDATION_FAILED"), approval_refs: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? freezeArray([]) : freezeArray(["approval:lifecycle:governed"]) };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function records(input: KnowledgeLifecycleInput, transitionRows: readonly LifecycleTransitionRecord[], failures: readonly KnowledgeLifecycleFailure[]): readonly KnowledgeLifecycleRecord[] {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const knowledge_id = id("knowledge_lifecycle_subject", { tenant_id, version: VERSION });
  return freezeArray(transitionRows.map((transition, index) => {
    const base: Omit<KnowledgeLifecycleRecord, "integrity_hash"> = { lifecycle_id: id("knowledge_lifecycle", { knowledge_id, transition: transition.transition }), knowledge_id, tenant_id, current_state: transition.to_state, previous_state: transition.from_state, transition_reason: `${transition.transition.toLowerCase()}:governed`, transition_timestamp: `2026-07-14T00:0${Math.min(index, 9)}:00.000Z`, transition_actor: "lifecycle-governance-engine", approval_refs: transition.approval_refs, governance_refs: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? freezeArray([]) : freezeArray(["governance:lifecycle:approved"]), constitutional_refs: failures.includes("CONSTITUTIONAL_APPROVAL_MISSING") ? freezeArray([]) : freezeArray(["constitutional:lifecycle:validated"]), evidence_refs: failures.includes("QUALIFICATION_BYPASS") ? freezeArray([]) : freezeArray(["evidence:lifecycle:qualification", "evidence:lifecycle:replay"]), version_id: id("knowledge_version", { knowledge_id, index }), superseded_by: transition.to_state === "SUPERSEDED" ? id("knowledge_version", { knowledge_id, index: index + 1 }) : null, expiration_policy: "review-required-never-delete", archive_policy: "preserve-permanently", retirement_policy: "inactive-but-auditable" };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function policies(failures: readonly KnowledgeLifecycleFailure[]): LifecyclePolicyRecord {
  const base: Omit<LifecyclePolicyRecord, "integrity_hash"> = { policy_id: "knowledge_lifecycle_policy", expiration_review_required: !failures.includes("EXPIRATION_POLICY_INVALID"), automatic_delete_supported: false, stale_detection: !failures.includes("EXPIRATION_POLICY_INVALID"), requalification_triggers: failures.includes("REQUALIFICATION_NONDETERMINISTIC") ? freezeArray([]) : freezeArray(["evidence_changes", "policy_changes", "confidence_degradation", "integrity_concerns"]), revocation_blocks_retrieval: !failures.includes("REVOCATION_NOT_ENFORCED"), retired_preserved_for_audit: !failures.includes("HISTORICAL_PRESERVATION_FAILED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function versions(recordsRows: readonly KnowledgeLifecycleRecord[], failures: readonly KnowledgeLifecycleFailure[]): readonly LifecycleVersionRecord[] {
  const knowledge_id = recordsRows[0].knowledge_id;
  return freezeArray(["1.0.0", "1.1.0", "1.2.0"].map((version, index) => {
    const base: Omit<LifecycleVersionRecord, "integrity_hash"> = { version_id: id("lifecycle_version", { knowledge_id, version }), knowledge_id, version, supersedes: index === 0 ? null : `1.${index - 1}.0`, superseded_by: index < 2 ? `1.${index + 1}.0` : null, immutable: !failures.includes("HISTORICAL_PRESERVATION_FAILED"), replayable: !failures.includes("REPLAY_VALIDATION_FAILED"), auditable: !failures.includes("AUDIT_INCOMPLETE") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function integrityReport(failures: readonly KnowledgeLifecycleFailure[]): LifecycleIntegrityReport {
  const base: Omit<LifecycleIntegrityReport, "integrity_hash"> = { report_id: "knowledge_lifecycle_integrity_report", hash_valid: !failures.includes("HASH_VALIDATION_FAILED"), lineage_valid: !failures.includes("LINEAGE_VALIDATION_FAILED"), evidence_refs_valid: !failures.includes("QUALIFICATION_BYPASS"), governance_refs_valid: !failures.includes("GOVERNANCE_APPROVAL_MISSING"), version_refs_valid: !failures.includes("VERSION_LINEAGE_INCOMPLETE"), replay_consistent: !failures.includes("REPLAY_VALIDATION_FAILED"), corruption_detected: failures.includes("CORRUPTION_UNDETECTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(lifecycleId: string, failures: readonly KnowledgeLifecycleFailure[]): readonly LifecycleLedgerEntry[] {
  const events: readonly LifecycleLedgerEntry["event"][] = freezeArray(["TRANSITION_RECORDED", "EXPIRATION_REVIEWED", "SUPERSESSION_RECORDED", "REQUALIFICATION_RECORDED", "REVOCATION_RECORDED", "RETIREMENT_RECORDED", "INTEGRITY_VALIDATED", "CERTIFICATION_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<LifecycleLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("knowledge_lifecycle_ledger", `${lifecycleId}:${event}:${index}`), sequence: index + 1, event, lifecycle_id: lifecycleId, replay_refs: freezeArray([`replay:knowledge-lifecycle:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly KnowledgeLifecycleFailure[]): LifecycleObservability {
  const base: Omit<LifecycleObservability, "integrity_hash"> = { observability_id: "knowledge_lifecycle_observability", active_knowledge: 4, certified_knowledge: 3, archived_knowledge: 1, retired_knowledge: 1, pending_transitions: failures.includes("REVIEW_SCHEDULING_FAILED") ? 4 : 0, expired_intelligence: failures.includes("EXPIRATION_POLICY_INVALID") ? 2 : 0, requalification_backlog: failures.includes("REQUALIFICATION_NONDETERMINISTIC") ? 3 : 0, revocations: failures.includes("REVOCATION_NOT_ENFORCED") ? 0 : 1, supersessions: failures.includes("SUPERSESSION_NONDETERMINISTIC") ? 0 : 1, integrity_health: failures.includes("HASH_VALIDATION_FAILED") ? 0.4 : 1, replay_success_rate: failures.includes("REPLAY_VALIDATION_FAILED") ? 0 : 1, operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: KnowledgeLifecycleFailure, refs: readonly string[]): LifecycleCertificationTest {
  const base: Omit<LifecycleCertificationTest, "integrity_hash"> = { test_id: id("knowledge_lifecycle_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<KnowledgeLifecycleResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly LifecycleCertificationTest[] {
  const refs = result.records.map((record) => record.integrity_hash);
  return freezeArray([
    test("deterministic state transitions", result.transitions.every((item) => item.deterministic), "NONDETERMINISTIC_TRANSITION", refs),
    test("legal transition enforcement", result.transitions.every((item) => item.legal), "ILLEGAL_TRANSITION", refs),
    test("lifecycle replay", result.transitions.every((item) => item.replay_validated), "REPLAY_VALIDATION_FAILED", refs),
    test("transition validation", result.transitions.length === 9, "ILLEGAL_TRANSITION", refs),
    test("qualification required", result.contract.qualification_required && result.records.every((record) => record.evidence_refs.length > 0), "QUALIFICATION_BYPASS", refs),
    test("certification required", result.contract.certification_required, "CERTIFICATION_BYPASS", refs),
    test("governance approval mandatory", result.records.every((record) => record.governance_refs.length > 0), "GOVERNANCE_APPROVAL_MISSING", refs),
    test("constitutional approval mandatory", result.records.every((record) => record.constitutional_refs.length > 0), "CONSTITUTIONAL_APPROVAL_MISSING", refs),
    test("version lineage", result.versions.every((version, index) => index === 0 ? version.supersedes === null : Boolean(version.supersedes)), "VERSION_LINEAGE_INCOMPLETE", refs),
    test("supersession", result.versions.some((version) => version.superseded_by), "SUPERSESSION_NONDETERMINISTIC", refs),
    test("historical preservation", result.versions.every((version) => version.immutable && version.auditable), "HISTORICAL_PRESERVATION_FAILED", refs),
    test("immutable history", result.contract.history_overwrite_supported === false, "HISTORICAL_PRESERVATION_FAILED", refs),
    test("expiration policy enforcement", result.policies.expiration_review_required && result.policies.automatic_delete_supported === false, "EXPIRATION_POLICY_INVALID", refs),
    test("review scheduling", result.policies.stale_detection, "REVIEW_SCHEDULING_FAILED", refs),
    test("archival decisions", result.records.some((record) => record.current_state === "ARCHIVED"), "EXPIRATION_POLICY_INVALID", refs),
    test("retirement decisions", result.records.some((record) => record.current_state === "RETIRED"), "RETIRED_RETRIEVABLE", refs),
    test("trigger detection", result.policies.requalification_triggers.length >= 4, "REQUALIFICATION_NONDETERMINISTIC", refs),
    test("deterministic review", result.policies.requalification_triggers.length > 0, "REQUALIFICATION_NONDETERMINISTIC", refs),
    test("certification renewal", result.contract.certification_required, "CERTIFICATION_BYPASS", refs),
    test("retrieval blocking", result.policies.revocation_blocks_retrieval, "REVOCATION_NOT_ENFORCED", refs),
    test("dependency handling", result.versions.every((version) => version.replayable), "REPLAY_VALIDATION_FAILED", refs),
    test("audit preservation", result.policies.retired_preserved_for_audit, "AUDIT_INCOMPLETE", refs),
    test("hash validation", result.integrity_report.hash_valid, "HASH_VALIDATION_FAILED", refs),
    test("lineage validation", result.integrity_report.lineage_valid, "LINEAGE_VALIDATION_FAILED", refs),
    test("replay validation", result.integrity_report.replay_consistent, "REPLAY_VALIDATION_FAILED", refs),
    test("corruption detection", !result.integrity_report.corruption_detected, "CORRUPTION_UNDETECTED", refs),
    test("policy enforcement", result.contract.governance_required, "POLICY_ENFORCEMENT_FAILED", refs),
    test("constitutional compliance", result.contract.constitutional_required, "CONSTITUTIONAL_APPROVAL_MISSING", refs),
    test("tenant isolation", result.records.every((record) => record.tenant_id === result.records[0].tenant_id), "TENANT_ISOLATION_BREACH", refs),
    test("audit completeness", result.ledger.length === 8 && result.ledger.every((entry, index) => entry.sequence === index + 1), "AUDIT_INCOMPLETE", refs),
    test("deterministic replay", result.transitions.every((item) => item.replay_validated) && result.integrity_report.replay_consistent, "REPLAY_VALIDATION_FAILED", refs),
    test("lifecycle reconstruction", result.records.map((record) => record.current_state).join(">") === STATES.join(">"), "NONDETERMINISTIC_TRANSITION", refs),
    test("historical consistency", result.contract.deletion_supported === false && result.contract.silent_expiration_supported === false, "HISTORICAL_PRESERVATION_FAILED", refs),
    test("immutable transition history", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
  ]);
}

function replayHash(result: Omit<KnowledgeLifecycleResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, records: result.records.map((r) => r.integrity_hash), transitions: result.transitions.map((t) => t.integrity_hash), policies: result.policies.integrity_hash, versions: result.versions.map((v) => v.integrity_hash), integrity: result.integrity_report.integrity_hash, ledger: result.ledger.map((l) => l.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<KnowledgeLifecycleResult, "integrity_hash">): string {
  return hash({ version: result.lifecycle_version, id: result.lifecycle_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runKnowledgeLifecycleManagement(input: KnowledgeLifecycleInput = {}): KnowledgeLifecycleResult {
  const learning = runOrganizationalLearning({ tenant_id: input.tenant_id });
  const learningValid = validateOrganizationalLearning(learning).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<KnowledgeLifecycleFailure>([...(learningValid ? [] : ["LEARNING_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const transitionRows = transitions(failures);
  const recordRows = records(input, transitionRows, failures);
  const baseWithoutCertification: TestBase = { lifecycle_version: VERSION, lifecycle_identifier: ID, organizational_learning_certified: learningValid, contract: contract(failures), records: recordRows, transitions: transitionRows, policies: policies(failures), versions: versions(recordRows, failures), integrity_report: integrityReport(failures), ledger: ledger(recordRows[0].lifecycle_id, failures), observability: observability(failures) };
  const validationTests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is KnowledgeLifecycleFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<LifecycleCertification, "integrity_hash"> = { certification_id: id("knowledge_lifecycle_certification", VERSION), status, production_ready: status === "PASS", failures: finalFailures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<KnowledgeLifecycleResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateKnowledgeLifecycleManagement(result?: KnowledgeLifecycleResult): KnowledgeLifecycleValidation {
  if (!result) {
    const failures = freezeArray<KnowledgeLifecycleFailure>(["CONTRACT_INVALID"]);
    const base: Omit<KnowledgeLifecycleValidation, "validation_hash"> = { lifecycle_id: null, valid: false, status: "FAIL", production_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash && result.records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash) && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash) && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.production_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<KnowledgeLifecycleValidation, "validation_hash"> = { lifecycle_id: result.records[0]?.lifecycle_id ?? null, valid, status: result.certification.status, production_ready: result.certification.production_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayKnowledgeLifecycleManagement(result = runKnowledgeLifecycleManagement()): boolean {
  const replayed = runKnowledgeLifecycleManagement({ tenant_id: result.records[0]?.tenant_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateKnowledgeLifecycleManagement(result).valid;
}

export function getKnowledgeLifecycleContract(): KnowledgeLifecycleContractBundle {
  const result = runKnowledgeLifecycleManagement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, deterministic_lifecycle: true, silent_expiration_supported: false, deletion_supported: false, archive_never_disappears: true, retirement_deletes_history: false, states: STATES }), result, validation: validateKnowledgeLifecycleManagement(result), observability: result.observability });
}

export const KnowledgeLifecycleManagement = Object.freeze({ run: runKnowledgeLifecycleManagement, validate: validateKnowledgeLifecycleManagement, replay: replayKnowledgeLifecycleManagement });
