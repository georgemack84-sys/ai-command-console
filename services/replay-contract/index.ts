import { runBoundaryCertificationGate } from "@/services/boundary-certification-gate";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { BoundaryCertificationReport } from "@/types/boundary-certification-gate";
import type {
  ReplayArtifactManifest,
  ReplayConfidenceAssessment,
  ReplayConfidenceLevel,
  ReplayContractFramework,
  ReplayContractPackage,
  ReplayContractScenario,
  ReplayContractVisibilitySurface,
  ReplayGovernanceReferences,
  ReplayIdentity,
  ReplayIntegrityRecord,
  ReplayLifecycleState,
  ReplayOrderingGuarantee,
  ReplayReferences,
  ReplayScope,
  ReplayType,
  ReplayValidationFailure,
  ReplayValidationResult,
} from "@/types/replay-contract";

const NOW = "2026-06-30T07:00:00.000Z";
const VERSION = "replay-contract/v8G.1" as const;
const ORDER = Object.freeze(["Mission", "Planning", "Decision", "Delegation", "Orchestration", "Execution", "Supervision", "Intervention", "Outcome", "Completion"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function lifecycleFor(scenario: ReplayContractScenario): ReplayLifecycleState {
  if (scenario === "ARTIFACT_MISSING") return "ARTIFACT_MISSING";
  if (scenario === "HASH_FAILURE" || scenario === "HASH_MISMATCH") return "HASH_FAILURE";
  if (scenario === "ORDER_MISMATCH") return "ORDER_MISMATCH";
  if (scenario === "GOVERNANCE_FAILURE" || scenario === "CONSTITUTION_MISMATCH" || scenario === "AUTHORITY_MISSING") return "GOVERNANCE_FAILURE";
  if (scenario === "LINEAGE_FAILURE") return "LINEAGE_FAILURE";
  if (scenario === "TENANT_VIOLATION" || scenario === "LOW_CONFIDENCE" || scenario === "DUPLICATE_IDENTITY") return "REPLAY_INVALID";
  return "COMPLETED";
}

function identityHashSource(identity: Omit<ReplayIdentity, "integrity_hash"> | ReplayIdentity) {
  return { replay_id: identity.replay_id, replay_version: identity.replay_version, tenant_id: identity.tenant_id, mission_id: identity.mission_id, execution_id: identity.execution_id, workflow_id: identity.workflow_id, plan_id: identity.plan_id, session_id: identity.session_id, replay_type: identity.replay_type, replay_scope: identity.replay_scope, replay_status: identity.replay_status, created_timestamp: identity.created_timestamp, completed_timestamp: identity.completed_timestamp, requested_by: identity.requested_by, requested_reason: identity.requested_reason, parent_replay: identity.parent_replay, child_replays: identity.child_replays, lineage_reference: identity.lineage_reference, truth_reference: identity.truth_reference, contract_version: identity.contract_version };
}
export function computeReplayIdentityHash(identity: Omit<ReplayIdentity, "integrity_hash"> | ReplayIdentity): string {
  return hashValue("replay-identity", identityHashSource(identity));
}

function buildIdentity(source: BoundaryCertificationReport, scenario: ReplayContractScenario, replay_type: ReplayType, replay_scope: ReplayScope): ReplayIdentity {
  const base = {
    replay_id: scenario === "DUPLICATE_IDENTITY" ? "REPLAY-DUPLICATE" : id("RPL", "replay-id", { certification: source.certification_id, replay_type, replay_scope }),
    replay_version: VERSION,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : source.source_governance_package.governance_enforcement.tenant_id,
    mission_id: source.source_governance_package.governance_enforcement.mission_id,
    execution_id: source.source_governance_package.governance_enforcement.execution_id,
    workflow_id: source.source_governance_package.governance_enforcement.workflow_id,
    plan_id: "plan:controlled-autonomy:8g",
    session_id: id("RPS", "replay-session-id", source.certification_id),
    replay_type,
    replay_scope,
    replay_status: lifecycleFor(scenario),
    created_timestamp: NOW,
    completed_timestamp: NOW,
    requested_by: "operator:mission-control",
    requested_reason: "Phase 8G deterministic replay readiness validation",
    parent_replay: null,
    child_replays: freezeArray([]),
    lineage_reference: scenario === "LINEAGE_FAILURE" ? "" : source.certification_evidence.lineage_references[0],
    truth_reference: source.certification_evidence.truth_ledger_references[0],
    contract_version: VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-replay-identity" : computeReplayIdentityHash(base) });
}

function buildReferences(source: BoundaryCertificationReport, identity: ReplayIdentity): ReplayReferences {
  const g = source.source_governance_package.governance_enforcement;
  return Object.freeze({
    mission_reference: g.mission_id,
    workflow_reference: g.workflow_id,
    execution_reference: g.execution_id,
    planning_reference: identity.plan_id,
    decision_reference: source.certification_result.result_id,
    delegation_reference: source.certification_evidence.authority_package_id,
    orchestration_reference: source.certification_evidence.boundary_contract_id,
    supervision_reference: "runtime-supervision-certification-gate/v8E.E",
    intervention_reference: "intervention-recommendation-engine/v8E.D",
    governance_reference: source.certification_evidence.governance_package_id,
    truth_reference: identity.truth_reference,
    integrity_reference: source.integrity_hash,
    replay_reference: source.replay_report.replay_hash,
    lineage_reference: identity.lineage_reference,
  });
}

function manifestHashSource(manifest: Omit<ReplayArtifactManifest, "manifest_hash"> | ReplayArtifactManifest) {
  return { manifest_id: manifest.manifest_id, identity_artifacts: manifest.identity_artifacts, planning_artifacts: manifest.planning_artifacts, execution_artifacts: manifest.execution_artifacts, decision_artifacts: manifest.decision_artifacts, delegation_artifacts: manifest.delegation_artifacts, orchestration_artifacts: manifest.orchestration_artifacts, runtime_artifacts: manifest.runtime_artifacts, governance_artifacts: manifest.governance_artifacts, truth_ledger_artifacts: manifest.truth_ledger_artifacts, integrity_artifacts: manifest.integrity_artifacts, missing_artifacts: manifest.missing_artifacts, completeness: manifest.completeness };
}
export function computeReplayArtifactManifestHash(manifest: Omit<ReplayArtifactManifest, "manifest_hash"> | ReplayArtifactManifest): string {
  return hashValue("replay-artifact-manifest", manifestHashSource(manifest));
}
function buildManifest(source: BoundaryCertificationReport, identity: ReplayIdentity, scenario: ReplayContractScenario): ReplayArtifactManifest {
  const missing = scenario === "ARTIFACT_MISSING" ? ["planning:alternatives", "runtime:health-metrics"] : [];
  const base = {
    manifest_id: id("RPM", "replay-manifest-id", identity.replay_id),
    identity_artifacts: freezeArray([identity.integrity_hash, identity.mission_id, identity.tenant_id, identity.execution_id]),
    planning_artifacts: freezeArray(missing.includes("planning:alternatives") ? ["planning:records", "planning:confidence"] : ["planning:records", "planning:alternatives", "planning:confidence", "planning:assumptions"]),
    execution_artifacts: freezeArray(["execution:plan", "execution:states", "execution:checkpoints", "execution:completion"]),
    decision_artifacts: freezeArray(["decision:graph", "decision:evidence", "decision:reasoning", "decision:confidence-history"]),
    delegation_artifacts: freezeArray(["delegation:graph", "delegation:authority-validation", "delegation:routing"]),
    orchestration_artifacts: freezeArray(["orchestration:dependency-graph", "orchestration:workflow-states", "orchestration:scheduling"]),
    runtime_artifacts: freezeArray(missing.includes("runtime:health-metrics") ? ["runtime:state", "runtime:supervision-events"] : ["runtime:state", "runtime:health-metrics", "runtime:supervision-events", "runtime:monitoring-evidence"]),
    governance_artifacts: freezeArray(["governance:policies", "governance:constitution", "governance:authority-approvals", "governance:recommendations"]),
    truth_ledger_artifacts: freezeArray(source.certification_evidence.truth_ledger_references),
    integrity_artifacts: freezeArray(source.certification_evidence.evidence_hashes),
    missing_artifacts: freezeArray(missing),
    completeness: missing.length ? "INCOMPLETE" as const : "COMPLETE" as const,
  };
  return Object.freeze({ ...base, manifest_hash: computeReplayArtifactManifestHash(base) });
}

function orderingHashSource(ordering: Omit<ReplayOrderingGuarantee, "ordering_hash"> | ReplayOrderingGuarantee) {
  return { ordering_id: ordering.ordering_id, preserved_order: ordering.preserved_order, deterministic_sequence_numbers: ordering.deterministic_sequence_numbers, dependency_ordering_hash: ordering.dependency_ordering_hash, checkpoint_ordering_hash: ordering.checkpoint_ordering_hash, state_transition_ordering_hash: ordering.state_transition_ordering_hash, causality_hash: ordering.causality_hash, ordering_state: ordering.ordering_state };
}
export function computeReplayOrderingHash(ordering: Omit<ReplayOrderingGuarantee, "ordering_hash"> | ReplayOrderingGuarantee): string {
  return hashValue("replay-ordering", orderingHashSource(ordering));
}
function buildOrdering(identity: ReplayIdentity, scenario: ReplayContractScenario): ReplayOrderingGuarantee {
  const order = scenario === "ORDER_MISMATCH" ? ["Mission", "Decision", "Planning", "Delegation", "Orchestration", "Execution", "Supervision", "Intervention", "Outcome", "Completion"] : ORDER;
  const base = { ordering_id: id("RPO", "replay-ordering-id", identity.replay_id), preserved_order: freezeArray(order), deterministic_sequence_numbers: freezeArray(order.map((_, index) => index + 1)), dependency_ordering_hash: hashValue("replay-dependency-order", order), checkpoint_ordering_hash: hashValue("replay-checkpoint-order", order), state_transition_ordering_hash: hashValue("replay-state-order", order), causality_hash: hashValue("replay-causality", order), ordering_state: scenario === "ORDER_MISMATCH" ? "MISMATCH" as const : "MATCH" as const };
  return Object.freeze({ ...base, ordering_hash: computeReplayOrderingHash(base) });
}

function integrityHashSource(record: Omit<ReplayIntegrityRecord, "integrity_hash"> | ReplayIntegrityRecord) {
  return { integrity_id: record.integrity_id, planning_hash: record.planning_hash, decision_hash: record.decision_hash, orchestration_hash: record.orchestration_hash, delegation_hash: record.delegation_hash, supervision_hash: record.supervision_hash, execution_hash: record.execution_hash, intervention_hash: record.intervention_hash, replay_hash: record.replay_hash, mission_hash: record.mission_hash, truth_ledger_hash: record.truth_ledger_hash, verification_state: record.verification_state };
}
export function computeReplayIntegrityHash(record: Omit<ReplayIntegrityRecord, "integrity_hash"> | ReplayIntegrityRecord): string {
  return hashValue("replay-integrity", integrityHashSource(record));
}
function buildIntegrity(source: BoundaryCertificationReport, identity: ReplayIdentity, scenario: ReplayContractScenario): ReplayIntegrityRecord {
  const fail = scenario === "HASH_FAILURE" || scenario === "HASH_MISMATCH";
  const base = { integrity_id: id("RPI", "replay-integrity-id", identity.replay_id), planning_hash: hashValue("planning-hash", identity.plan_id), decision_hash: source.certification_result.result_hash, orchestration_hash: source.certification_evidence.boundary_contract_id, delegation_hash: source.certification_evidence.authority_package_id, supervision_hash: hashValue("supervision-hash", source.certification_evidence.lineage_references), execution_hash: source.certification_evidence.execution_package_id, intervention_hash: hashValue("intervention-hash", source.certification_evidence.evidence_hashes), replay_hash: source.replay_report.replay_hash, mission_hash: hashValue("mission-hash", identity.mission_id), truth_ledger_hash: hashValue("truth-ledger-hash", source.certification_evidence.truth_ledger_references), verification_state: fail ? "FAIL" as const : "PASS" as const };
  return Object.freeze({ ...base, integrity_hash: fail ? "tampered-replay-integrity" : computeReplayIntegrityHash(base) });
}

function confidenceLevel(score: number): ReplayConfidenceLevel {
  if (score >= 1) return "EXACT";
  if (score >= 0.97) return "VERY_HIGH";
  if (score >= 0.9) return "HIGH";
  if (score >= 0.75) return "MEDIUM";
  if (score >= 0.5) return "LOW";
  return "INSUFFICIENT";
}
function buildConfidence(manifest: ReplayArtifactManifest, ordering: ReplayOrderingGuarantee, integrity: ReplayIntegrityRecord, governanceValid: boolean, scenario: ReplayContractScenario): ReplayConfidenceAssessment {
  const artifact = manifest.completeness === "COMPLETE" ? 1 : 0.45;
  const orderingScore = ordering.ordering_state === "MATCH" ? 1 : 0.3;
  const integrityScore = integrity.verification_state === "PASS" ? 1 : 0.25;
  const governance = governanceValid ? 1 : 0.4;
  const forced = scenario === "LOW_CONFIDENCE";
  const score = forced ? 0.42 : Number(((artifact + orderingScore + artifact + integrityScore + governance + artifact + integrityScore + orderingScore) / 8).toFixed(4));
  const base = { confidence_id: id("RPC", "replay-confidence-id", manifest.manifest_id), artifact_completeness: artifact, ordering_consistency: orderingScore, evidence_completeness: artifact, integrity_validation: integrityScore, governance_consistency: governance, dependency_completeness: artifact, hash_verification: integrityScore, replay_determinism: orderingScore, confidence_score: score, confidence_level: confidenceLevel(score) };
  return Object.freeze({ ...base, confidence_hash: hashValue("replay-confidence", base) });
}

function governanceHashSource(governance: Omit<ReplayGovernanceReferences, "governance_hash"> | ReplayGovernanceReferences) {
  return { constitution_version: governance.constitution_version, policy_version: governance.policy_version, authority_reference: governance.authority_reference, approval_reference: governance.approval_reference, risk_reference: governance.risk_reference, compliance_reference: governance.compliance_reference, boundary_reference: governance.boundary_reference, governance_state: governance.governance_state, operator_reference: governance.operator_reference };
}
export function computeReplayGovernanceHash(governance: Omit<ReplayGovernanceReferences, "governance_hash"> | ReplayGovernanceReferences): string {
  return hashValue("replay-governance", governanceHashSource(governance));
}
function buildGovernance(source: BoundaryCertificationReport, scenario: ReplayContractScenario): ReplayGovernanceReferences {
  const invalid = ["GOVERNANCE_FAILURE", "CONSTITUTION_MISMATCH", "AUTHORITY_MISSING"].includes(scenario);
  const base = { constitution_version: scenario === "CONSTITUTION_MISMATCH" ? "constitution:changed" : source.constitution_version, policy_version: "policy:runtime:v8f4", authority_reference: scenario === "AUTHORITY_MISSING" ? "" : source.certification_evidence.authority_package_id, approval_reference: "operator:mission-control", risk_reference: "risk:boundary-certified", compliance_reference: "compliance:governance-policy:v8f4", boundary_reference: source.certification_evidence.boundary_contract_id, governance_state: invalid ? "INVALID" as const : "VALID" as const, operator_reference: "operator:mission-control" };
  return Object.freeze({ ...base, governance_hash: computeReplayGovernanceHash(base) });
}

function collectFailures(identity: ReplayIdentity, manifest: ReplayArtifactManifest, ordering: ReplayOrderingGuarantee, integrity: ReplayIntegrityRecord, confidence: ReplayConfidenceAssessment, governance: ReplayGovernanceReferences, scenario: ReplayContractScenario): readonly ReplayValidationFailure[] {
  const failures: ReplayValidationFailure[] = [];
  if (scenario === "DUPLICATE_IDENTITY") failures.push("REPLAY_ID_NOT_UNIQUE");
  if (manifest.completeness !== "COMPLETE") failures.push("REQUIRED_ARTIFACT_MISSING");
  if (integrity.verification_state !== "PASS" || computeReplayIntegrityHash(integrity) !== integrity.integrity_hash) failures.push("HASH_VALIDATION_FAILED");
  if (ordering.ordering_state !== "MATCH") failures.push("ORDERING_MISMATCH");
  if (governance.governance_state !== "VALID") failures.push("GOVERNANCE_REFERENCE_INVALID");
  if (scenario === "CONSTITUTION_MISMATCH") failures.push("CONSTITUTION_REFERENCE_CHANGED");
  if (!governance.authority_reference) failures.push("AUTHORITY_CHAIN_MISSING");
  if (!identity.lineage_reference) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATION");
  if (confidence.confidence_score < 0.9) failures.push("CONFIDENCE_BELOW_THRESHOLD");
  if (scenario === "HASH_MISMATCH" || computeReplayIdentityHash(identity) !== identity.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function buildValidation(identity: ReplayIdentity, manifest: ReplayArtifactManifest, ordering: ReplayOrderingGuarantee, integrity: ReplayIntegrityRecord, confidence: ReplayConfidenceAssessment, governance: ReplayGovernanceReferences, scenario: ReplayContractScenario): ReplayValidationResult {
  const failures = collectFailures(identity, manifest, ordering, integrity, confidence, governance, scenario);
  const has = (failure: ReplayValidationFailure) => failures.includes(failure);
  const validation_state = failures.length ? "FAIL" as const : "PASS" as const;
  const base = { replay_id: identity.replay_id, validation_state, failures };
  return Object.freeze({
    validation_id: id("RPV", "replay-validation-id", base),
    replay_id: identity.replay_id,
    validation_state,
    failures,
    identity_unique: !has("REPLAY_ID_NOT_UNIQUE"),
    artifacts_complete: !has("REQUIRED_ARTIFACT_MISSING"),
    hashes_valid: !has("HASH_VALIDATION_FAILED") && !has("INTEGRITY_HASH_MISMATCH"),
    ordering_exact: !has("ORDERING_MISMATCH"),
    governance_valid: !has("GOVERNANCE_REFERENCE_INVALID"),
    constitution_unchanged: !has("CONSTITUTION_REFERENCE_CHANGED"),
    authority_chain_preserved: !has("AUTHORITY_CHAIN_MISSING"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    confidence_certifiable: !has("CONFIDENCE_BELOW_THRESHOLD"),
    certification_ready: validation_state === "PASS",
    validation_hash: hashValue("replay-validation", base),
  });
}

function packageHashSource(pkg: Omit<ReplayContractPackage, "package_hash">) {
  return { package_id: pkg.package_id, identity_hash: pkg.replay_identity.integrity_hash, manifest_hash: pkg.artifact_manifest.manifest_hash, ordering_hash: pkg.ordering.ordering_hash, integrity_hash: pkg.integrity_record.integrity_hash, confidence_hash: pkg.confidence.confidence_hash, governance_hash: pkg.governance.governance_hash, validation_hash: pkg.validation.validation_hash };
}
export function buildReplayContractPackage(input: { scenario?: ReplayContractScenario; sourceBoundaryCertification?: BoundaryCertificationReport; replay_type?: ReplayType; replay_scope?: ReplayScope } = {}): ReplayContractPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_boundary_certification = input.sourceBoundaryCertification ?? runBoundaryCertificationGate();
  const replay_identity = buildIdentity(source_boundary_certification, scenario, input.replay_type ?? "CERTIFICATION", input.replay_scope ?? "ENTIRE_MISSION");
  const references = buildReferences(source_boundary_certification, replay_identity);
  const artifact_manifest = buildManifest(source_boundary_certification, replay_identity, scenario);
  const ordering = buildOrdering(replay_identity, scenario);
  const integrity_record = buildIntegrity(source_boundary_certification, replay_identity, scenario);
  const governance = buildGovernance(source_boundary_certification, scenario);
  const confidence = buildConfidence(artifact_manifest, ordering, integrity_record, governance.governance_state === "VALID", scenario);
  const validation = buildValidation(replay_identity, artifact_manifest, ordering, integrity_record, confidence, governance, scenario);
  const full = { package_id: id("RPP", "replay-contract-package-id", { replay: replay_identity.replay_id, scenario }), contract_version: VERSION, source_boundary_certification, replay_identity, references, artifact_manifest, ordering, integrity_record, confidence, governance, validation, immutable: true as const, speculative_replay_permitted: false as const };
  return Object.freeze({ ...full, package_hash: hashValue("replay-contract-package", packageHashSource(full)) });
}

export function buildReplayContractVisibilitySurface(pkg = buildReplayContractPackage()): ReplayContractVisibilitySurface {
  return Object.freeze({ replay_id: pkg.replay_identity.replay_id, replay_status: pkg.replay_identity.replay_status, replay_type: pkg.replay_identity.replay_type, replay_scope: pkg.replay_identity.replay_scope, confidence_level: pkg.confidence.confidence_level, confidence_score: pkg.confidence.confidence_score, validation_state: pkg.validation.validation_state, failures: pkg.validation.failures, artifact_completeness: pkg.artifact_manifest.completeness, ordering_state: pkg.ordering.ordering_state, integrity_state: pkg.integrity_record.verification_state, governance_state: pkg.governance.governance_state, certification_ready: pkg.validation.certification_ready });
}

export function getReplayContractFramework(): ReplayContractFramework {
  const pkg = buildReplayContractPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "complete", "explainable", "immutable", "replayable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "cryptographically-verifiable", "independently-reproducible", "fail-closed"]),
      contract_version: VERSION,
      replay_types: freezeArray(["EXECUTION", "PLANNING", "DECISION", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "FORENSIC", "CERTIFICATION"] as const),
      replay_scopes: freezeArray(["ENTIRE_MISSION", "MISSION_PHASE", "WORKFLOW", "TASK", "DECISION", "PLANNING_SESSION", "DELEGATION", "RUNTIME_WINDOW", "SUPERVISION_EVENT", "INTERVENTION", "GOVERNANCE_REVIEW", "FORENSIC_INVESTIGATION"] as const),
      lifecycle_states: freezeArray(["REGISTERED", "VALIDATING", "COLLECTING_ARTIFACTS", "VERIFYING_INTEGRITY", "RECONSTRUCTING", "VERIFYING_ORDER", "VALIDATING_GOVERNANCE", "CALCULATING_CONFIDENCE", "COMPLETED", "ARTIFACT_MISSING", "HASH_FAILURE", "ORDER_MISMATCH", "GOVERNANCE_FAILURE", "LINEAGE_FAILURE", "REPLAY_INVALID", "REPLAY_ABORTED"] as const),
      confidence_levels: freezeArray(["EXACT", "VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] as const),
    }),
    package: pkg,
    visibility: buildReplayContractVisibilitySurface(pkg),
  });
}
