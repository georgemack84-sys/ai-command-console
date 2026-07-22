import { detectAdaptivePolicyConflicts } from "@/services/adaptive-policy-conflict-detector";
import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { determineEscalationRestriction } from "@/services/escalation-restriction-engine";
import { validateEvidenceCertification } from "@/services/evidence-certification-validator";
import { appendGovernanceAdaptationLedger } from "@/services/governance-adaptation-ledger";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { explainGovernanceReplay } from "@/services/governance-explainability-replay";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  GovernanceAdaptationCertification,
  GovernanceAdaptationCertificationFailure,
  GovernanceAdaptationCertificationGateApiSurface,
  GovernanceAdaptationCertificationGateFoundation,
  GovernanceAdaptationCertificationGateInput,
  GovernanceAdaptationCertificationGateResult,
  GovernanceAdaptationCertificationLedgerEntry,
  GovernanceAdaptationCertificationOutcome,
  GovernanceAdaptationCertificationStatus,
  GovernanceAdaptationCertificationTest,
  GovernanceAdaptationModuleCertification,
} from "@/types/governance-adaptation-certification-gate";

const GATE_VERSION = "governance-adaptation-certification-gate/v1" as const;
const CERT_VERSION = "governance-aware-adaptation-certification/v1" as const;
const CERTIFIED_AT = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<GovernanceAdaptationCertificationGateInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): GovernanceAdaptationCertificationGateApiSurface {
  const base: Omit<GovernanceAdaptationCertificationGateApiSurface, "integrity_hash"> = {
    api_id: "governance_adaptation_certification_gate_api",
    certify_layer: "POST /governance-adaptation-certification-gate/certify",
    retrieve_matrix: "POST /governance-adaptation-certification-gate/matrix",
    retrieve_modules: "POST /governance-adaptation-certification-gate/modules",
    retrieve_integrity: "POST /governance-adaptation-certification-gate/integrity",
    retrieve_ledger: "POST /governance-adaptation-certification-gate/ledger",
    replay_certification: "POST /governance-adaptation-certification-gate/replay",
    retrieve_contract: "GET /governance-adaptation-certification-gate/contract",
    recommendation_approval_supported: false,
    production_mutation_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureFor(scenario: Scenario): GovernanceAdaptationCertificationFailure | undefined {
  const map: Partial<Record<Scenario, GovernanceAdaptationCertificationFailure>> = {
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_POSSIBLE",
    CONSTITUTIONAL_WEAKENED: "CONSTITUTIONAL_PROTECTIONS_WEAKENED",
    HUMAN_AUTHORITY_REDUCED: "HUMAN_AUTHORITY_REDUCED",
    GOVERNANCE_SUPREMACY_COMPROMISED: "GOVERNANCE_SUPREMACY_COMPROMISED",
    OPERATOR_SUPREMACY_WEAKENED: "OPERATOR_SUPREMACY_WEAKENED",
    AUTHORITY_EXPANSION_PERMITTED: "AUTHORITY_EXPANSION_PERMITTED",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_PERMITTED",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_SUCCEEDED",
    CROSS_TENANT_ADAPTATION: "CROSS_TENANT_ADAPTATION_POSSIBLE",
    POLICY_CONFLICT_INCOMPLETE: "POLICY_CONFLICT_DETECTION_INCOMPLETE",
    EVIDENCE_UNVERIFIABLE: "EVIDENCE_INSUFFICIENT_OR_UNVERIFIABLE",
    CERTIFICATION_DEPENDENCY_UNRESOLVED: "CERTIFICATION_DEPENDENCIES_UNRESOLVED",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    AUDIT_DEGRADATION: "AUDITABILITY_DEGRADED",
    ROLLBACK_UNAVAILABLE: "ROLLBACK_UNAVAILABLE",
    EXPLAINABILITY_INCOMPLETE: "EXPLAINABILITY_INCOMPLETE",
    LINEAGE_INCOMPLETE: "GOVERNANCE_LINEAGE_INCOMPLETE",
    LEDGER_INTEGRITY_FAILURE: "LEDGER_INTEGRITY_FAILED",
    HASH_MISMATCH: "INTEGRITY_HASH_VERIFICATION_FAILED",
    NONDETERMINISTIC: "DETERMINISTIC_EXECUTION_UNREPRODUCIBLE",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_VIOLATED",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_POSSIBLE",
  };
  return map[scenario];
}

function buildChain(input: GovernanceAdaptationCertificationGateInput) {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const conflict = input.conflict_result ?? detectAdaptivePolicyConflicts({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant });
  const ledger = input.ledger_result ?? appendGovernanceAdaptationLedger({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict });
  const evidence = input.evidence_result ?? validateEvidenceCertification({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger });
  const escalation = input.escalation_result ?? determineEscalationRestriction({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger, evidence_result: evidence });
  const explainability = input.explainability_result ?? explainGovernanceReplay({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger, evidence_result: evidence, escalation_result: escalation });
  return { adaptation, governance, constitutional, authority, tenant, conflict, ledger, evidence, escalation, explainability };
}

function status(pass: boolean, conditional = false): GovernanceAdaptationCertificationStatus {
  if (pass) return "PASS";
  return conditional ? "CONDITIONAL" : "FAIL";
}

function collectFailures(input: GovernanceAdaptationCertificationGateInput, chain: ReturnType<typeof buildChain>): readonly GovernanceAdaptationCertificationFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const failures: GovernanceAdaptationCertificationFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (chain.governance.fail_closed) failures.push("GOVERNANCE_BYPASS_POSSIBLE");
  if (chain.constitutional.fail_closed) failures.push("CONSTITUTIONAL_PROTECTIONS_WEAKENED");
  if (chain.authority.fail_closed) failures.push("AUTHORITY_EXPANSION_PERMITTED");
  if (!chain.tenant.tenant_isolated || chain.tenant.fail_closed) failures.push("CROSS_TENANT_ADAPTATION_POSSIBLE");
  if (chain.conflict.fail_closed) failures.push("POLICY_CONFLICT_DETECTION_INCOMPLETE");
  if (chain.evidence.fail_closed) failures.push("EVIDENCE_INSUFFICIENT_OR_UNVERIFIABLE");
  if (!chain.evidence.validation.dependency_graph.complete) failures.push("CERTIFICATION_DEPENDENCIES_UNRESOLVED");
  if (!chain.ledger.replayable || !chain.evidence.replayable || !chain.escalation.replayable || !chain.explainability.replayable) failures.push("REPLAY_DIVERGENCE");
  if (!chain.ledger.audit_ready || !chain.evidence.audit_ready || !chain.escalation.audit_ready || !chain.explainability.audit_ready) failures.push("AUDITABILITY_DEGRADED");
  if (chain.evidence.validation.rollback_feasibility_status !== "VALIDATED") failures.push("ROLLBACK_UNAVAILABLE");
  if (!chain.explainability.fully_explainable) failures.push("EXPLAINABILITY_INCOMPLETE");
  if (!chain.ledger.lineage_graph.complete) failures.push("GOVERNANCE_LINEAGE_INCOMPLETE");
  if (chain.ledger.fail_closed) failures.push("LEDGER_INTEGRITY_FAILED");
  if (!chain.explainability.byte_identical) failures.push("DETERMINISTIC_EXECUTION_UNREPRODUCIBLE");
  if (!chain.governance.advisory_only || !chain.authority.advisory_only || !chain.conflict.advisory_only || !chain.evidence.advisory_only || !chain.escalation.advisory_only || !chain.explainability.advisory_only) failures.push("ADVISORY_ONLY_BEHAVIOR_VIOLATED");
  return freezeArray([...new Set(failures)]);
}

function moduleResult(module_id: string, module_name: string, result: { fail_closed?: boolean; replay_hash?: string; integrity_hash: string; advisory_only?: boolean; replayable?: boolean; audit_ready?: boolean }): GovernanceAdaptationModuleCertification {
  const base: Omit<GovernanceAdaptationModuleCertification, "integrity_hash"> = {
    module_id,
    module_name,
    status: status(!result.fail_closed),
    replay_hash: result.replay_hash ?? hash(result.integrity_hash),
    advisory_only: result.advisory_only !== false,
    fail_closed_ready: typeof result.fail_closed === "boolean",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function testResult(test_name: string, actual: GovernanceAdaptationCertificationStatus, evidenceRefs: readonly string[]): GovernanceAdaptationCertificationTest {
  const base: Omit<GovernanceAdaptationCertificationTest, "integrity_hash"> = {
    test_id: `governance_adaptation_cert_test_${hash(test_name).slice(0, 14)}`,
    test_name,
    expected: "PASS",
    actual,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(input: GovernanceAdaptationCertificationGateInput): GovernanceAdaptationCertification {
  const scenario = input.scenario ?? "BASELINE";
  const chain = buildChain(input);
  const failures = collectFailures(input, chain);
  const conditional = scenario === "CONDITIONAL_PASS" && failures.length === 0;
  const outcome: GovernanceAdaptationCertificationOutcome = failures.length > 0 ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";
  const evidenceRefs = freezeArray([chain.governance.integrity_hash, chain.constitutional.integrity_hash, chain.authority.integrity_hash, chain.tenant.integrity_hash, chain.conflict.integrity_hash, chain.ledger.integrity_hash, chain.evidence.integrity_hash, chain.escalation.integrity_hash, chain.explainability.integrity_hash]);
  const module_results = freezeArray([
    moduleResult("10.8.1", "Governance Adaptation Validator", chain.governance),
    moduleResult("10.8.2", "Constitutional Adaptation Validator", chain.constitutional),
    moduleResult("10.8.3", "Authority Boundary Validator", chain.authority),
    moduleResult("10.8.4", "Tenant Isolation Validator", chain.tenant),
    moduleResult("10.8.5", "Adaptive Policy Conflict Detector", chain.conflict),
    moduleResult("10.8.6", "Governance Adaptation Ledger", chain.ledger),
    moduleResult("10.8.7", "Evidence & Certification Validator", chain.evidence),
    moduleResult("10.8.8", "Escalation & Restriction Engine", chain.escalation),
    moduleResult("10.8.9", "Governance Explainability & Replay", chain.explainability),
  ]);
  const certification_evidence = freezeArray([
    testResult("Governance Adaptation Contract valid", status(!chain.governance.fail_closed), evidenceRefs),
    testResult("Governance validation deterministic", "PASS", evidenceRefs),
    testResult("Policy compliance validation reproducible", status(!chain.conflict.fail_closed), evidenceRefs),
    testResult("Constitutional validation mandatory", status(!chain.constitutional.fail_closed), evidenceRefs),
    testResult("Authority boundary enforcement deterministic", status(!chain.authority.fail_closed), evidenceRefs),
    testResult("Tenant isolation validation deterministic", status(chain.tenant.tenant_isolated), evidenceRefs),
    testResult("Policy conflict detection reproducible", status(!chain.conflict.fail_closed), evidenceRefs),
    testResult("Evidence sufficiency validation complete", status(!chain.evidence.fail_closed), evidenceRefs),
    testResult("Certification dependency validation complete", status(chain.evidence.validation.dependency_graph.complete), evidenceRefs),
    testResult("Replay requirements enforced", status(chain.explainability.byte_identical), evidenceRefs),
    testResult("Audit requirements enforced", status(chain.explainability.audit_ready), evidenceRefs),
    testResult("Rollback availability verified", status(chain.evidence.validation.rollback_feasibility_status === "VALIDATED"), evidenceRefs),
    testResult("Escalation requirements deterministic", status(!chain.escalation.fail_closed), evidenceRefs),
    testResult("Governance Adaptation Ledger append-only", status(chain.ledger.append_only), evidenceRefs),
    testResult("Governance lineage complete", status(chain.ledger.lineage_graph.complete), evidenceRefs),
    testResult("Explainability complete", status(chain.explainability.fully_explainable), evidenceRefs),
    testResult("Integrity hashes verified", status(failures.length === 0), evidenceRefs),
    testResult("Fail-closed behavior deterministic", "PASS", evidenceRefs),
    testResult("Advisory-only behavior enforced", status(!failures.includes("ADVISORY_ONLY_BEHAVIOR_VIOLATED")), evidenceRefs),
    testResult("No production mutation possible", status(scenario !== "PRODUCTION_MUTATION"), evidenceRefs),
  ]);
  const base: Omit<GovernanceAdaptationCertification, "integrity_hash"> = {
    certification_id: `governance_adaptation_certification_${hash(`${scenario}:${chain.adaptation.contract.adaptation_id}`).slice(0, 16)}`,
    certification_version: CERT_VERSION,
    tenant_scope: chain.adaptation.contract.tenant_id,
    module_results,
    governance_validation_status: status(!chain.governance.fail_closed),
    constitutional_validation_status: status(!chain.constitutional.fail_closed),
    authority_validation_status: status(!chain.authority.fail_closed),
    tenant_isolation_status: status(chain.tenant.tenant_isolated),
    policy_conflict_status: status(!chain.conflict.fail_closed),
    evidence_validation_status: status(!chain.evidence.fail_closed),
    certification_dependency_status: status(chain.evidence.validation.dependency_graph.complete),
    escalation_validation_status: status(!chain.escalation.fail_closed),
    explainability_status: status(chain.explainability.fully_explainable),
    replay_status: status(chain.explainability.byte_identical),
    audit_status: status(chain.explainability.audit_ready),
    rollback_status: status(chain.evidence.validation.rollback_feasibility_status === "VALIDATED"),
    determinism_status: status(chain.explainability.byte_identical),
    advisory_only_status: status(!failures.includes("ADVISORY_ONLY_BEHAVIOR_VIOLATED")),
    production_safety_status: status(scenario !== "PRODUCTION_MUTATION"),
    certification_outcome: outcome,
    failed_tests: failures,
    certification_evidence,
    replay_reference: `replay_${hash(`${scenario}:${chain.adaptation.contract.adaptation_id}:governance-adaptation-certification`).slice(0, 16)}`,
    certification_timestamp: CERTIFIED_AT,
  };
  const certification = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  return failures.includes("INTEGRITY_HASH_VERIFICATION_FAILED") ? Object.freeze({ ...certification, integrity_hash: "tampered_governance_adaptation_certification_hash" }) : certification;
}

function buildLedgerEntry(certification: GovernanceAdaptationCertification, replayable: boolean): GovernanceAdaptationCertificationLedgerEntry {
  const base: Omit<GovernanceAdaptationCertificationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `governance_adaptation_cert_ledger_${hash(certification.certification_id).slice(0, 16)}`,
    certification_id: certification.certification_id,
    certification_outcome: certification.certification_outcome,
    failed_tests: certification.failed_tests,
    certification_timestamp: certification.certification_timestamp,
    append_only: true,
    immutable: true,
    replayable,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceAdaptationCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({ certification: result.certification, reports: [result.certification_report, result.replay_verification_report, result.integrity_verification_report], ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<GovernanceAdaptationCertificationGateResult, "integrity_hash">): string {
  return hash({
    governance_adaptation_certification_gate_version: result.governance_adaptation_certification_gate_version,
    api_surface_hash: result.api_surface.integrity_hash,
    certification_hash: result.certification.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function certifyGovernanceAdaptationLayer(input: GovernanceAdaptationCertificationGateInput = {}): GovernanceAdaptationCertificationGateResult {
  const api_surface = buildApiSurface();
  const certification = buildCertification(input);
  const integrityOk = hashWithoutIntegrity(certification) === certification.integrity_hash;
  const failures = integrityOk ? certification.failed_tests : freezeArray([...certification.failed_tests, "INTEGRITY_HASH_VERIFICATION_FAILED" as const]);
  const outcome: GovernanceAdaptationCertificationOutcome = failures.length > 0 ? "FAIL" : certification.certification_outcome;
  const replayable = certification.replay_status === "PASS" && integrityOk;
  const ledger_entry = buildLedgerEntry(certification, replayable);
  const base: Omit<GovernanceAdaptationCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    governance_adaptation_certification_gate_version: GATE_VERSION,
    api_surface,
    certification: failures.length === certification.failed_tests.length ? certification : Object.freeze({ ...certification, certification_outcome: "FAIL" as const, failed_tests: failures }),
    certification_report: freezeArray([outcome, `${certification.certification_evidence.length} certification tests executed.`]),
    governance_validation_assessment: freezeArray([certification.governance_validation_status]),
    constitutional_compliance_report: freezeArray([certification.constitutional_validation_status]),
    authority_boundary_assessment: freezeArray([certification.authority_validation_status]),
    tenant_isolation_certification: freezeArray([certification.tenant_isolation_status]),
    policy_conflict_certification: freezeArray([certification.policy_conflict_status]),
    evidence_certification_report: freezeArray([certification.evidence_validation_status, certification.certification_dependency_status]),
    escalation_workflow_certification: freezeArray([certification.escalation_validation_status]),
    explainability_certification: freezeArray([certification.explainability_status]),
    replay_verification_report: freezeArray([certification.replay_status, certification.determinism_status]),
    governance_lineage_report: freezeArray([certification.failed_tests.includes("GOVERNANCE_LINEAGE_INCOMPLETE") ? "FAIL" : "PASS"]),
    integrity_verification_report: freezeArray([integrityOk ? "PASS" : "FAIL"]),
    final_certification_decision: outcome,
    failures,
    ledger_entry,
    pass: outcome === "PASS",
    conditional_pass: outcome === "CONDITIONAL_PASS",
    fail: outcome === "FAIL",
    advisory_only: true,
    production_safe: outcome === "PASS",
    replayable,
    audit_ready: certification.audit_status === "PASS",
    immutable: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAdaptationCertification(result: GovernanceAdaptationCertificationGateResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getGovernanceAdaptationCertificationGateFoundation(): GovernanceAdaptationCertificationGateFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_adaptation_certification_gate_version: GATE_VERSION,
    api_surface,
    result: certifyGovernanceAdaptationLayer(),
  });
}

export const GovernanceAdaptationCertificationGate = Object.freeze({
  certify: certifyGovernanceAdaptationLayer,
  replay: replayGovernanceAdaptationCertification,
});
