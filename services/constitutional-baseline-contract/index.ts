import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  ConstitutionalAuditRecord,
  ConstitutionalBaselineContract,
  ConstitutionalBaselineContractBundle,
  ConstitutionalBaselineFailure,
  ConstitutionalBaselineInput,
  ConstitutionalBaselineObservabilitySurface,
  ConstitutionalBaselineScenario,
  ConstitutionalBaselineValidationResult,
  ConstitutionalComplianceSchema,
  ConstitutionalGovernanceRequirements,
  ConstitutionalInvariantCategory,
  ConstitutionalInvariantRecord,
  MissionScopeRecord,
} from "@/types/constitutional-baseline-contract";

const VERSION = "constitutional-baseline-contract/v8ALT.10.1" as const;
const categories = Object.freeze(["AUTHORITY", "GOVERNANCE", "DETERMINISM", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION", "LEARNING", "OPTIMIZATION", "RECOVERY", "CERTIFICATION", "SECURITY", "AUDITABILITY", "EXPLAINABILITY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ConstitutionalBaselineScenario): ConstitutionalBaselineFailure | null {
  const map: Partial<Record<ConstitutionalBaselineScenario, ConstitutionalBaselineFailure>> = {
    CONSTITUTIONAL_VERSION_MISMATCH: "CONSTITUTIONAL_VERSION_MISMATCH",
    MISSING_INVARIANT: "MISSING_INVARIANT_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    OPERATOR_BYPASS: "OPERATOR_BYPASS_DETECTED",
    NONDETERMINISTIC_EXECUTION: "NONDETERMINISTIC_EXECUTION_DETECTED",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_DETECTED",
    INTEGRITY_CORRUPTION: "INTEGRITY_CORRUPTION_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION_DETECTED",
    UNAUTHORIZED_LEARNING: "UNAUTHORIZED_LEARNING_DETECTED",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION_DETECTED",
    UNAUTHORIZED_RECOVERY: "UNAUTHORIZED_RECOVERY_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    HIDDEN_STATE: "HIDDEN_STATE_DETECTED",
    CONSTITUTIONAL_MODIFICATION: "CONSTITUTIONAL_MODIFICATION_DETECTED",
    MISSING_AUDIT_EVIDENCE: "AUDIT_EVIDENCE_MISSING",
    INCOMPLETE_REPLAY_LINEAGE: "REPLAY_LINEAGE_INCOMPLETE",
    FAIL_OPEN_BEHAVIOR: "FAIL_OPEN_BEHAVIOR_DETECTED",
  };
  return map[scenario] ?? null;
}

function buildInvariants(scenario: ConstitutionalBaselineScenario): readonly ConstitutionalInvariantRecord[] {
  return freezeArray(categories.map((category, index) => Object.freeze({
    invariant_id: id("CBI", "constitutional-invariant", category),
    invariant_name: `${category.toLowerCase()} invariant`,
    category,
    description: `${category} must remain deterministic, governed, replayable, and operator-supervised.`,
    validation_rule: `validate:${category.toLowerCase()}:baseline`,
    severity: "CRITICAL" as const,
    mandatory: true as const,
    constitutional_reference: `constitution:${category.toLowerCase()}`,
    effective_version: VERSION,
    status: scenario === "MISSING_INVARIANT" && index === 0 ? "MISSING" as const : "ACTIVE" as const,
  })));
}

function buildMissionScopes(): readonly MissionScopeRecord[] {
  return freezeArray(["mission-control", "knowledge-evolution", "recovery", "optimization"].map((mission_type) => Object.freeze({
    mission_scope_id: id("CBS", "constitutional-mission-scope", mission_type),
    mission_type,
    authorized_capabilities: freezeArray(["advisory-analysis", "deterministic-replay", "operator-supervised-recommendation"]),
    restricted_capabilities: freezeArray(["autonomous-execution", "policy-modification", "authority-escalation", "hidden-state"]),
    mission_constraints: freezeArray(["governance-before-action", "operator-final-authority", "tenant-isolation"]),
    risk_threshold: 0.2,
    operator_required_actions: freezeArray(["approve-high-risk-changes", "approve-activation", "review-recovery"]),
    escalation_rules: freezeArray(["fail-closed-on-uncertainty", "escalate-governance-conflict"]),
  })));
}

function governanceRequirements(scenario: ConstitutionalBaselineScenario): ConstitutionalGovernanceRequirements {
  return Object.freeze({
    policy_validation_required: true,
    constitution_validation_required: true,
    approval_validation_required: true,
    risk_validation_required: true,
    compliance_validation_required: true,
    audit_validation_required: true,
    evidence_validation_required: true,
    certification_validation_required: true,
    governance_precedes_execution: true,
    governance_bypass_allowed: scenario === "GOVERNANCE_BYPASS",
    governance_evidence_immutable: true,
  });
}

function complianceSchema(scenario: ConstitutionalBaselineScenario): ConstitutionalComplianceSchema {
  const source = {
    schema_id: id("CBCS", "constitutional-compliance-schema", scenario),
    sections: Object.freeze({
      CONSTITUTION: "REQUIRED" as const,
      AUTHORITY: "REQUIRED" as const,
      GOVERNANCE: "REQUIRED" as const,
      OPERATOR: "REQUIRED" as const,
      DETERMINISM: "REQUIRED" as const,
      REPLAY: "REQUIRED" as const,
      INTEGRITY: "REQUIRED" as const,
      ISOLATION: "REQUIRED" as const,
      LEARNING: "PROHIBITED" as const,
      OPTIMIZATION: "PROHIBITED" as const,
      RECOVERY: "CONDITIONAL" as const,
      CERTIFICATION: "REQUIRED" as const,
    }),
    prohibited_operations: freezeArray(["constitutional-modification", "governance-bypass", "operator-bypass", "hidden-execution", "hidden-state", "autonomous-deployment"]),
    required_evidence: scenario === "MISSING_AUDIT_EVIDENCE" ? freezeArray([]) : freezeArray(["audit:evidence", "replay:evidence", "governance:evidence", "integrity:evidence"]),
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "INTEGRITY_CORRUPTION" ? "" : hashValue("constitutional-compliance-schema", source) });
}

function audit(failure: ConstitutionalBaselineFailure, scenario: ConstitutionalBaselineScenario): ConstitutionalAuditRecord {
  const source = { audit_id: id("CBA", "constitutional-baseline-audit", { failure, scenario }), failure, immutable: true as const, append_only: true as const, evidence_reference: `evidence:constitutional:${failure}`, replay_reference: `replay:constitutional:${failure}` };
  return Object.freeze({ ...source, integrity_hash: hashValue("constitutional-baseline-audit", source) });
}

function collectFailures(contract: Omit<ConstitutionalBaselineContract, "integrity_hash"> | ConstitutionalBaselineContract): readonly ConstitutionalBaselineFailure[] {
  return unique([
    ...contract.failures,
    ...(contract.version_definition.constitution_version !== VERSION ? ["CONSTITUTIONAL_VERSION_MISMATCH" as const] : []),
    ...(contract.invariant_registry.some((invariant) => invariant.status === "MISSING") ? ["MISSING_INVARIANT_DETECTED" as const] : []),
    ...(contract.authority_model.privilege_escalation_allowed ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(contract.governance_requirements.governance_bypass_allowed ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(contract.authority_model.operator_authority !== "SUPREME" ? ["OPERATOR_BYPASS_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.DETERMINISM !== "REQUIRED" ? ["NONDETERMINISTIC_EXECUTION_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.REPLAY !== "REQUIRED" ? ["REPLAY_DIVERGENCE_DETECTED" as const] : []),
    ...(!contract.compliance_schema.integrity_hash || !contract.version_definition.checksum ? ["INTEGRITY_CORRUPTION_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.ISOLATION !== "REQUIRED" ? ["TENANT_ISOLATION_VIOLATION_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.LEARNING !== "PROHIBITED" ? ["UNAUTHORIZED_LEARNING_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.OPTIMIZATION !== "PROHIBITED" ? ["UNAUTHORIZED_OPTIMIZATION_DETECTED" as const] : []),
    ...(contract.compliance_schema.sections.RECOVERY === "PROHIBITED" ? ["UNAUTHORIZED_RECOVERY_DETECTED" as const] : []),
    ...(contract.mission_scopes.some((scope) => scope.authorized_capabilities.includes("hidden-execution")) ? ["HIDDEN_EXECUTION_DETECTED" as const] : []),
    ...(contract.mission_scopes.some((scope) => scope.authorized_capabilities.includes("hidden-state")) ? ["HIDDEN_STATE_DETECTED" as const] : []),
    ...(contract.constitution_modification_authorized ? ["CONSTITUTIONAL_MODIFICATION_DETECTED" as const] : []),
    ...(contract.compliance_schema.required_evidence.length === 0 ? ["AUDIT_EVIDENCE_MISSING" as const] : []),
    ...(contract.version_definition.lineage_reference.length === 0 ? ["REPLAY_LINEAGE_INCOMPLETE" as const] : []),
    ...(contract.fail_open_authorized ? ["FAIL_OPEN_BEHAVIOR_DETECTED" as const] : []),
  ]);
}

export function getConstitutionalBaselineContract(input: ConstitutionalBaselineInput = {}): ConstitutionalBaselineContract {
  if (input.contract) return input.contract;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const schema = complianceSchema(scenario);
  const versionSource = {
    constitution_id: id("CBC", "constitutional-version", scenario),
    constitution_version: scenario === "CONSTITUTIONAL_VERSION_MISMATCH" ? "constitutional-baseline-contract/v0.0.0" as typeof VERSION : VERSION,
    constitution_name: "CATA Constitutional Baseline" as const,
    major_version: 8 as const,
    minor_version: 101 as const,
    effective_date: "1970-01-01T00:00:00.000Z" as const,
    approval_reference: "approval:constitutional-baseline",
    status: "CERTIFIED_BASELINE" as const,
    lineage_reference: scenario === "INCOMPLETE_REPLAY_LINEAGE" ? "" : "lineage:constitutional-baseline",
  };
  const version_definition = Object.freeze({ ...versionSource, checksum: scenario === "INTEGRITY_CORRUPTION" ? "" : hashValue("constitutional-version", versionSource) });
  const source = {
    contract_id: id("CBC", "constitutional-baseline-contract", scenario),
    version_definition,
    mission_scopes: buildMissionScopes(),
    authority_model: Object.freeze({ operator_authority: scenario === "OPERATOR_BYPASS" ? "BYPASSED" as "SUPREME" : "SUPREME" as const, governance_authority: "MANDATORY" as const, agent_authority: "ADVISORY_ONLY" as const, mission_authority: "BOUNDED" as const, approval_chains: freezeArray(["operator", "governance", "certification"]), delegation_rules: freezeArray(["bounded delegation only", "no inherited authority outside policy"]), authority_escalation_rules: freezeArray(["escalation requires operator approval"]), authority_revocation_rules: freezeArray(["operator may revoke autonomy"]), emergency_authority_limits: freezeArray(["emergency recommendations only"]), autonomous_authority_creation_allowed: false as const, privilege_escalation_allowed: scenario === "AUTHORITY_ESCALATION" }),
    governance_requirements: governanceRequirements(scenario),
    invariant_registry: buildInvariants(scenario),
    compliance_schema: scenario === "UNAUTHORIZED_LEARNING" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, LEARNING: "REQUIRED" as const }) }) : scenario === "UNAUTHORIZED_OPTIMIZATION" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, OPTIMIZATION: "REQUIRED" as const }) }) : scenario === "UNAUTHORIZED_RECOVERY" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, RECOVERY: "PROHIBITED" as const }) }) : scenario === "NONDETERMINISTIC_EXECUTION" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, DETERMINISM: "OPTIONAL" as const }) }) : scenario === "REPLAY_DIVERGENCE" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, REPLAY: "OPTIONAL" as const }) }) : scenario === "TENANT_ISOLATION_VIOLATION" ? Object.freeze({ ...schema, sections: Object.freeze({ ...schema.sections, ISOLATION: "OPTIONAL" as const }) }) : schema,
    audit_records: freezeArray<ConstitutionalAuditRecord>([]),
    failures: freezeArray(injected ? [injected] : []),
    contract_only: true as const,
    execution_authority_granted: false as const,
    mission_outcome_modification_authorized: false as const,
    governance_modification_authorized: false as const,
    constitution_modification_authorized: false as const,
    fail_open_authorized: false as const,
    final_state: "CONSTITUTIONAL_BASELINE_DEFINED" as const,
  };
  const failures = collectFailures(source);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const contract = { ...source, failures, audit_records, final_state: failures.length ? "CONSTITUTIONAL_BASELINE_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...contract, integrity_hash: scenario === "INTEGRITY_CORRUPTION" ? "" : hashValue("constitutional-baseline-contract", contract) });
}

export function getConstitutionalInvariants(input: ConstitutionalBaselineInput = {}) { return getConstitutionalBaselineContract(input).invariant_registry; }
export function getConstitutionalComplianceSchema(input: ConstitutionalBaselineInput = {}) { return getConstitutionalBaselineContract(input).compliance_schema; }
export function getConstitutionalAuthorityModel(input: ConstitutionalBaselineInput = {}) { return getConstitutionalBaselineContract(input).authority_model; }
export function getConstitutionalGovernanceRequirements(input: ConstitutionalBaselineInput = {}) { return getConstitutionalBaselineContract(input).governance_requirements; }
export function listConstitutionalAuditRecords(input: ConstitutionalBaselineInput = {}) { return getConstitutionalBaselineContract(input).audit_records; }

export function validateConstitutionalBaseline(contract = getConstitutionalBaselineContract()): ConstitutionalBaselineValidationResult {
  const failures = unique([...collectFailures(contract), ...(!contract.integrity_hash ? ["INTEGRITY_CORRUPTION_DETECTED" as const] : [])]);
  const has = (failure: ConstitutionalBaselineFailure) => failures.includes(failure);
  const valid = failures.length === 0 && contract.final_state === "CONSTITUTIONAL_BASELINE_DEFINED" && contract.contract_only && !contract.execution_authority_granted && !contract.fail_open_authorized;
  const source = { contract_id: contract.contract_id, valid, version_valid: !has("CONSTITUTIONAL_VERSION_MISMATCH"), invariants_complete: !has("MISSING_INVARIANT_DETECTED"), authority_preserved: !has("AUTHORITY_ESCALATION_DETECTED"), governance_enforced: !has("GOVERNANCE_BYPASS_DETECTED"), operator_supremacy_preserved: !has("OPERATOR_BYPASS_DETECTED"), deterministic: !has("NONDETERMINISTIC_EXECUTION_DETECTED"), replay_fidelity_preserved: !has("REPLAY_DIVERGENCE_DETECTED"), integrity_verified: !has("INTEGRITY_CORRUPTION_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATION_DETECTED"), learning_restricted: !has("UNAUTHORIZED_LEARNING_DETECTED"), optimization_restricted: !has("UNAUTHORIZED_OPTIMIZATION_DETECTED"), recovery_restricted: !has("UNAUTHORIZED_RECOVERY_DETECTED"), hidden_execution_absent: !has("HIDDEN_EXECUTION_DETECTED"), hidden_state_absent: !has("HIDDEN_STATE_DETECTED"), audit_evidence_complete: !has("AUDIT_EVIDENCE_MISSING"), replay_lineage_complete: !has("REPLAY_LINEAGE_INCOMPLETE"), fail_closed: valid || failures.length > 0 || contract.final_state !== "CONSTITUTIONAL_BASELINE_DEFINED", contract_only: true as const, execution_authority_granted: false as const, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("constitutional-baseline-validation", source) });
}

export function buildConstitutionalBaselineObservabilitySurface(contract = getConstitutionalBaselineContract()): ConstitutionalBaselineObservabilitySurface {
  return Object.freeze({ contract_id: contract.contract_id, final_state: contract.final_state, invariant_count: contract.invariant_registry.length, mission_scope_count: contract.mission_scopes.length, audit_count: contract.audit_records.length, failure_count: contract.failures.length, contract_only: true, execution_authority_granted: false, integrity_hash: contract.integrity_hash });
}

export function getConstitutionalBaselineContractBundle(): ConstitutionalBaselineContractBundle {
  const contract = getConstitutionalBaselineContract();
  return Object.freeze({ doctrine: Object.freeze({ contract_version: VERSION, final_state: "CONSTITUTIONAL_BASELINE_READY", invariant_categories: categories, principles: freezeArray(["immutable-constitution", "contract-only", "operator-supremacy", "governance-supremacy", "advisory-autonomy", "deterministic-validation", "replay-fidelity", "tenant-isolation", "fail-closed"]) }), contract, validation: validateConstitutionalBaseline(contract), observability: buildConstitutionalBaselineObservabilitySurface(contract) });
}
