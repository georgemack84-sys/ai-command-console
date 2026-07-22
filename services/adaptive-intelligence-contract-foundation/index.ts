import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runFinalOrchestratorCertification } from "@/services/decision-final-orchestrator-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { FinalOrchestratorCertificationResult } from "@/types/decision-final-orchestrator-certification";
import type {
  AdaptiveContractCertificationMetadata,
  AdaptiveContractCheck,
  AdaptiveContractFailure,
  AdaptiveContractFoundation,
  AdaptiveContractFoundationInput,
  AdaptiveContractFoundationResult,
  AdaptiveContractIdentityRecord,
  AdaptiveContractInheritanceRules,
  AdaptiveContractLedgerEntry,
  AdaptiveContractReplayBinding,
  AdaptiveContractValidation,
  AdaptiveContractValidationReport,
  AdaptiveContractValidationState,
  AdaptiveDomain,
  AdaptiveIntelligenceContract,
} from "@/types/adaptive-intelligence-contract-foundation";

const FOUNDATION_VERSION = "adaptive-intelligence-contract-foundation/v1" as const;

export const ADAPTIVE_CONTRACT_CHECKS: readonly AdaptiveContractCheck[] = Object.freeze(["SCHEMA_VALIDATION", "IDENTITY_VALIDATION", "VERSION_VALIDATION", "SCOPE_VALIDATION", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "AUTHORITY_VALIDATION", "CERTIFICATION_VALIDATION", "INTEGRITY_VALIDATION", "LIFECYCLE_VALIDATION", "INHERITANCE_VALIDATION", "SAFETY_VALIDATION"]);
export const ADAPTIVE_DOMAINS_ALLOWED: readonly AdaptiveDomain[] = Object.freeze(["LEARNING_RULES", "SIMULATION_RULES", "RECOMMENDATION_RULES", "CONFIDENCE_CALIBRATION", "RISK_ADAPTATION", "MEMORY_ADAPTATION", "FORECAST_ADAPTATION"]);

type Scenario = NonNullable<AdaptiveContractFoundationInput["scenario"]>;

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

function state(pass: boolean): AdaptiveContractValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: FinalOrchestratorCertificationResult) {
  return {
    tenant_id: source.final_report.tenant_id,
    mission_id: source.final_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: FinalOrchestratorCertificationResult, role: VisibilityRole): boolean {
  return source.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildContract(source: FinalOrchestratorCertificationResult, scenario: Scenario): AdaptiveIntelligenceContract {
  const c = ctx(source);
  const base: Omit<AdaptiveIntelligenceContract, "integrity_hash"> = {
    contract_id: scenario === "DUPLICATE_IDENTITY" ? "adaptive_contract_duplicate" : "adaptive_intelligence_contract_phase_10",
    contract_name: "Mission Control Adaptive Intelligence Constitutional Contract",
    contract_version: Object.freeze({
      major: scenario === "INVALID_VERSION" ? 0 : 10,
      minor: 0,
      patch: 1,
      certification_version: source.certification_version,
      replay_version: source.replay_hash,
      version_label: scenario === "INVALID_VERSION" ? "0.0.0" : "10.0.1",
      version_state: "ACTIVE",
    }),
    tenant_id: scenario === "MISSING_TENANT" ? "" : c.tenant_id,
    mission_scope: scenario === "MISSING_MISSION" ? freezeArray([]) : freezeArray([c.mission_id, "adaptive-intelligence"]),
    tenant_scope: "TENANT",
    contract_owner: "mission-control-adaptive-intelligence",
    contract_authority: Object.freeze({
      owning_authority: scenario === "AUTHORITY_UNDEFINED" ? "" : "Mission Control Constitution",
      governance_authority: scenario === "AUTHORITY_UNDEFINED" ? "" : "Mission Control Governance",
      certification_authority: scenario === "AUTHORITY_UNDEFINED" ? "" : "Mission Control Certification Authority",
      approving_authority: scenario === "AUTHORITY_UNDEFINED" ? "" : "Mission Control Operator Authority",
      operator_authority: scenario === "AUTHORITY_UNDEFINED" ? "" : "Human Operator",
      update_proposers: scenario === "INCOMPLETE_AUTHORITY_REFS" ? freezeArray([]) : freezeArray(["governance-admin", "certification-admin"]),
      self_certification_allowed: (scenario === "SELF_CERTIFICATION" ? true : false) as false,
      self_activation_allowed: (scenario === "SELF_ACTIVATION" ? true : false) as false,
    }),
    adaptive_domains_allowed: ADAPTIVE_DOMAINS_ALLOWED,
    adaptive_domains_restricted: freezeArray(["LEARNING_RULES", "MEMORY_ADAPTATION", "FORECAST_ADAPTATION"]),
    prohibited_learning_targets: scenario === "MISSING_PROHIBITED_TARGETS" ? freezeArray([]) : freezeArray(["constitutional-rules", "governance-policies", "authority-boundaries", "tenant-boundaries", "execution-permissions"]),
    governance_requirements: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["policy-enforcement", "operator-approval", "auditability", "fail-closed"]),
    constitutional_requirements: scenario === "MISSING_CONSTITUTION" ? freezeArray([]) : freezeArray(["advisory-only", "tenant-isolation", "authority-bound", "replay-required"]),
    authority_requirements: scenario === "INCOMPLETE_AUTHORITY_REFS" ? freezeArray([]) : freezeArray(["human-approval-required", "no-self-activation", "no-self-certification"]),
    replay_required: true,
    simulation_required: true,
    certification_required: true,
    rollback_required: (scenario === "ROLLBACK_DISABLED" ? false : true) as true,
    advisory_only: (scenario === "ADVISORY_DISABLED" ? false : true) as true,
    lifecycle_state: scenario === "LIFECYCLE_VIOLATION" ? "ACTIVE" : "CERTIFIED",
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([source.replay_hash, source.final_replay_report.report_id]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([source.final_report.report_id, source.production_readiness.security_certification.governance_boundary_report.report_id]),
    certification_refs: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : freezeArray([source.production_approval_decision.decision_id, source.final_ledger[source.final_ledger.length - 1]?.ledger_entry_id ?? "final:ledger"]),
    created_at: "2026-07-05T10:00:01.000Z",
    updated_at: "2026-07-05T10:00:01.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.contract_id }) });
  return built;
}

function buildIdentity(contract: AdaptiveIntelligenceContract, scenario: Scenario): AdaptiveContractIdentityRecord {
  const base: Omit<AdaptiveContractIdentityRecord, "integrity_hash"> = {
    identity_record_id: "adaptive_contract_identity_record",
    contract_id: contract.contract_id,
    contract_name: contract.contract_name,
    version_label: contract.contract_version.version_label,
    owner: contract.contract_owner,
    authority_level: contract.contract_authority.owning_authority,
    tenant_id: contract.tenant_id,
    mission_scope: contract.mission_scope,
    created_at: contract.created_at,
    immutable: scenario !== "LIFECYCLE_VIOLATION",
    unique_identity: scenario !== "DUPLICATE_IDENTITY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayBinding(source: FinalOrchestratorCertificationResult, contract: AdaptiveIntelligenceContract, scenario: Scenario): AdaptiveContractReplayBinding {
  const c = ctx(source);
  const base: Omit<AdaptiveContractReplayBinding, "integrity_hash"> = {
    replay_binding_id: "adaptive_contract_replay_binding",
    tenant_id: c.tenant_id,
    contract_id: contract.contract_id,
    replay_identifier: scenario === "MISSING_REPLAY" ? "" : source.replay_hash,
    replay_version: contract.contract_version.replay_version,
    replay_lineage: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([source.final_replay_report.report_id, source.phase_9_completion_report.report_id]),
    replay_refs: contract.replay_refs,
    replay_integrity_verified: scenario !== "MISSING_REPLAY" && scenario !== "HASH_MISMATCH",
    replay_timestamp: "2026-07-05T10:00:02.000Z",
    deterministic_reconstruction: scenario !== "MISSING_REPLAY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(contract: AdaptiveIntelligenceContract, scenario: Scenario): AdaptiveContractCertificationMetadata {
  const base: Omit<AdaptiveContractCertificationMetadata, "integrity_hash"> = {
    certification_id: "adaptive_contract_certification_metadata",
    contract_id: contract.contract_id,
    certification_version: contract.contract_version.certification_version,
    certification_authority: contract.contract_authority.certification_authority,
    certification_timestamp: "2026-07-05T10:00:03.000Z",
    certification_status: scenario === "MISSING_CERTIFICATION" || scenario === "SELF_CERTIFICATION" ? "BLOCKED" : "CERTIFIED",
    certification_evidence: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : freezeArray(contract.certification_refs),
    certification_replay: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(contract.replay_refs),
    certification_hash: hash(contract),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildInheritance(contract: AdaptiveIntelligenceContract, scenario: Scenario): AdaptiveContractInheritanceRules {
  const base: Omit<AdaptiveContractInheritanceRules, "integrity_hash"> = {
    inheritance_id: "adaptive_contract_inheritance_rules",
    contract_id: contract.contract_id,
    governance_requirements_inherited: scenario !== "RESTRICTION_WEAKENED",
    constitutional_requirements_inherited: scenario !== "RESTRICTION_WEAKENED",
    replay_requirements_inherited: scenario !== "RESTRICTION_WEAKENED",
    authority_boundaries_inherited: scenario !== "RESTRICTION_WEAKENED",
    advisory_only_inherited: scenario !== "RESTRICTION_WEAKENED",
    certification_requirements_inherited: scenario !== "RESTRICTION_WEAKENED",
    rollback_requirements_inherited: scenario !== "RESTRICTION_WEAKENED",
    restrictions_weakened: (scenario === "RESTRICTION_WEAKENED" ? true : false) as false,
    cross_tenant_inheritance_allowed: (scenario === "CROSS_TENANT_INHERITANCE" ? true : false) as false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  finalCertification: FinalOrchestratorCertificationResult;
  contract: AdaptiveIntelligenceContract;
  identity: AdaptiveContractIdentityRecord;
  replay: AdaptiveContractReplayBinding;
  certification: AdaptiveContractCertificationMetadata;
  inheritance: AdaptiveContractInheritanceRules;
  ledger: readonly AdaptiveContractLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveContractFailure[] {
  const failures: AdaptiveContractFailure[] = [];
  if (input.finalCertification.validation.validation_status !== "VALID" || !input.finalCertification.phase_9_complete) failures.push("FINAL_ORCHESTRATOR_CERTIFICATION_INVALID");
  if (!input.identity.unique_identity) failures.push("DUPLICATE_CONTRACT_IDENTITY");
  if (input.contract.contract_version.major < 10 || input.contract.contract_version.version_label !== "10.0.1") failures.push("INVALID_CONTRACT_VERSION");
  if (!input.contract.tenant_id) failures.push("TENANT_SCOPE_MISSING");
  if (!input.contract.mission_scope.length) failures.push("MISSION_SCOPE_MISSING");
  if (!input.contract.contract_authority.owning_authority || !input.contract.contract_authority.governance_authority || !input.contract.contract_authority.certification_authority || !input.contract.contract_authority.approving_authority || !input.contract.contract_authority.operator_authority) failures.push("AUTHORITY_UNDEFINED");
  if (!input.contract.governance_requirements.length || !input.contract.governance_refs.length) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (!input.contract.constitutional_requirements.length) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (!input.contract.authority_requirements.length || !input.contract.contract_authority.update_proposers.length) failures.push("AUTHORITY_REFERENCES_INCOMPLETE");
  if (!input.contract.replay_refs.length || !input.replay.replay_identifier || !input.replay.replay_integrity_verified || !input.replay.deterministic_reconstruction) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.contract.certification_refs.length || !input.certification.certification_evidence.length || input.certification.certification_status !== "CERTIFIED") failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (!input.contract.advisory_only) failures.push("ADVISORY_ONLY_DISABLED");
  if (!input.contract.prohibited_learning_targets.length) failures.push("PROHIBITED_LEARNING_TARGETS_OMITTED");
  if (!input.contract.rollback_required) failures.push("ROLLBACK_DISABLED");
  if (
    hashWithoutIntegrity(input.contract) !== input.contract.integrity_hash
    || hashWithoutIntegrity(input.identity) !== input.identity.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.certification) !== input.certification.integrity_hash
    || hashWithoutIntegrity(input.inheritance) !== input.inheritance.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.contract.lifecycle_state === "ACTIVE" && input.scenario === "LIFECYCLE_VIOLATION") failures.push("LIFECYCLE_VIOLATION");
  if (input.inheritance.cross_tenant_inheritance_allowed) failures.push("CROSS_TENANT_INHERITANCE");
  if (input.inheritance.restrictions_weakened || !input.inheritance.governance_requirements_inherited || !input.inheritance.constitutional_requirements_inherited || !input.inheritance.advisory_only_inherited) failures.push("INHERITED_RESTRICTION_WEAKENED");
  if (input.scenario === "HIDDEN_PERMISSION") failures.push("HIDDEN_PERMISSION");
  if (input.contract.contract_authority.self_certification_allowed) failures.push("SELF_CERTIFICATION_ATTEMPTED");
  if (input.contract.contract_authority.self_activation_allowed) failures.push("SELF_ACTIVATION_ATTEMPTED");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  if (!visibleToRole(input.finalCertification, input.role)) failures.push("AUTHORIZATION_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildReport(contract: AdaptiveIntelligenceContract, failures: readonly AdaptiveContractFailure[]): AdaptiveContractValidationReport {
  const has = (failure: AdaptiveContractFailure) => failures.includes(failure);
  const base: Omit<AdaptiveContractValidationReport, "integrity_hash"> = {
    validation_id: "adaptive_contract_validation_report",
    contract_id: contract.contract_id,
    tenant_id: contract.tenant_id,
    checks: ADAPTIVE_CONTRACT_CHECKS,
    schema_valid: !has("FINAL_ORCHESTRATOR_CERTIFICATION_INVALID"),
    identity_valid: !has("DUPLICATE_CONTRACT_IDENTITY"),
    version_valid: !has("INVALID_CONTRACT_VERSION"),
    scope_valid: !has("TENANT_SCOPE_MISSING") && !has("MISSION_SCOPE_MISSING") && !has("CROSS_TENANT_INHERITANCE"),
    governance_valid: !has("GOVERNANCE_REFERENCES_MISSING") && !has("CONSTITUTIONAL_REFERENCES_MISSING"),
    replay_valid: !has("REPLAY_REFERENCES_MISSING"),
    authority_valid: !has("AUTHORITY_UNDEFINED") && !has("AUTHORITY_REFERENCES_INCOMPLETE"),
    certification_valid: !has("CERTIFICATION_REFERENCES_MISSING") && !has("SELF_CERTIFICATION_ATTEMPTED"),
    integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
    lifecycle_valid: !has("LIFECYCLE_VIOLATION") && !has("SELF_ACTIVATION_ATTEMPTED"),
    inheritance_valid: !has("INHERITED_RESTRICTION_WEAKENED"),
    safety_valid: !has("ADVISORY_ONLY_DISABLED") && !has("PROHIBITED_LEARNING_TARGETS_OMITTED") && !has("ROLLBACK_DISABLED") && !has("HIDDEN_PERMISSION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    validation_state: failures.length ? "FAIL" : "PASS",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(contract: AdaptiveIntelligenceContract, report: AdaptiveContractValidationReport, scenario: Scenario): readonly AdaptiveContractLedgerEntry[] {
  const events: Omit<AdaptiveContractLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "adaptive_contract_ledger_001", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "CONTRACT_CREATED", scope_ref: "contract_identity", evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:10.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_002", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "IDENTITY_REGISTERED", scope_ref: "identity_registry", evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:11.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_003", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "VERSION_VALIDATED", scope_ref: contract.contract_version.version_label, evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:12.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_004", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "REPLAY_BOUND", scope_ref: "replay_binding", evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:13.000Z", sequence_number: 4, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_005", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "GOVERNANCE_BOUND", scope_ref: "governance_binding", evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:14.000Z", sequence_number: 5, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_006", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: "CERTIFICATION_BOUND", scope_ref: "certification_metadata", evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:15.000Z", sequence_number: 6, append_only: true, deleted: false },
    { ledger_entry_id: "adaptive_contract_ledger_007", tenant_id: contract.tenant_id, contract_id: contract.contract_id, event_type: report.validation_state === "PASS" ? "CONTRACT_CERTIFIED" : "CONTRACT_BLOCKED", scope_ref: report.validation_id, evidence_ref: report.validation_id, validation_state: report.validation_state, replay_refs: contract.replay_refs, event_timestamp: "2026-07-05T10:00:16.000Z", sequence_number: 7, append_only: (scenario === "LIFECYCLE_VIOLATION" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly AdaptiveContractFailure[]): AdaptiveContractValidation {
  const has = (failure: AdaptiveContractFailure) => failures.includes(failure);
  const base: Omit<AdaptiveContractValidation, "integrity_hash"> = {
    validation_id: "adaptive_contract_foundation_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    final_orchestrator_certification_valid: !has("FINAL_ORCHESTRATOR_CERTIFICATION_INVALID"),
    identity_unique: !has("DUPLICATE_CONTRACT_IDENTITY"),
    version_valid: !has("INVALID_CONTRACT_VERSION"),
    tenant_scoped: !has("TENANT_SCOPE_MISSING"),
    mission_scoped: !has("MISSION_SCOPE_MISSING"),
    authority_defined: !has("AUTHORITY_UNDEFINED") && !has("AUTHORITY_REFERENCES_INCOMPLETE"),
    governance_bound: !has("GOVERNANCE_REFERENCES_MISSING") && !has("CONSTITUTIONAL_REFERENCES_MISSING"),
    replay_bound: !has("REPLAY_REFERENCES_MISSING"),
    certification_bound: !has("CERTIFICATION_REFERENCES_MISSING") && !has("SELF_CERTIFICATION_ATTEMPTED"),
    advisory_only: !has("ADVISORY_ONLY_DISABLED"),
    prohibited_targets_defined: !has("PROHIBITED_LEARNING_TARGETS_OMITTED"),
    rollback_enabled: !has("ROLLBACK_DISABLED"),
    lifecycle_valid: !has("LIFECYCLE_VIOLATION") && !has("SELF_ACTIVATION_ATTEMPTED"),
    inheritance_enforced: !has("CROSS_TENANT_INHERITANCE") && !has("INHERITED_RESTRICTION_WEAKENED"),
    security_boundaries_valid: !has("HIDDEN_PERMISSION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveContractFoundationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract: result.contract,
    identity: result.identity_record,
    replay: result.replay_binding,
    certification: result.certification_metadata,
    inheritance: result.inheritance_rules,
    report: result.validation_report,
    ledger: result.contract_ledger,
    validation: result.validation,
  });
}

export function runAdaptiveContractFoundation(input: AdaptiveContractFoundationInput = {}): AdaptiveContractFoundationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const final_certification = input.final_certification ?? runFinalOrchestratorCertification({ scenario: scenario === "FINAL_CERTIFICATION_INVALID" ? "PRODUCTION_INVALID" : "BASELINE" });
  const contract = buildContract(final_certification, scenario);
  const identity_record = buildIdentity(contract, scenario);
  const replay_binding = buildReplayBinding(final_certification, contract, scenario);
  const certification_metadata = buildCertification(contract, scenario);
  const inheritance_rules = buildInheritance(contract, scenario);
  const preFailures = collectFailures({ finalCertification: final_certification, contract, identity: identity_record, replay: replay_binding, certification: certification_metadata, inheritance: inheritance_rules, ledger: [], role, scenario });
  const validation_report = buildReport(contract, preFailures);
  const contract_ledger = buildLedger(contract, validation_report, scenario);
  const failures = collectFailures({ finalCertification: final_certification, contract, identity: identity_record, replay: replay_binding, certification: certification_metadata, inheritance: inheritance_rules, ledger: contract_ledger, role, scenario });
  const finalReport = buildReport(contract, failures);
  const validation = buildValidation(failures);
  const base: Omit<AdaptiveContractFoundationResult, "integrity_hash" | "replay_hash"> = {
    foundation_version: FOUNDATION_VERSION,
    final_certification,
    contract,
    identity_record,
    replay_binding,
    certification_metadata,
    inheritance_rules,
    validation_report: finalReport,
    contract_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    permits_adaptation: failures.length === 0,
    permits_execution: false,
    mutates_constitution: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveContractFoundation(result: AdaptiveContractFoundationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveContractHash(record: Omit<AdaptiveIntelligenceContract, "integrity_hash"> | AdaptiveIntelligenceContract): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveContractFoundation(): AdaptiveContractFoundation {
  return Object.freeze({
    foundation_version: FOUNDATION_VERSION,
    checks: ADAPTIVE_CONTRACT_CHECKS,
    allowed_domains: ADAPTIVE_DOMAINS_ALLOWED,
    result: runAdaptiveContractFoundation(),
  });
}

export const AdaptiveIntelligenceContractFoundation = Object.freeze({
  run: runAdaptiveContractFoundation,
  replay: replayAdaptiveContractFoundation,
});
