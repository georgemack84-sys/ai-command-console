import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  KnowledgeActivationContract,
  KnowledgeArtifactRecord,
  KnowledgeEvolutionContract,
  KnowledgeEvolutionContractBundle,
  KnowledgeEvolutionFailure,
  KnowledgeEvolutionInput,
  KnowledgeEvolutionObservabilitySurface,
  KnowledgeEvolutionScenario,
  KnowledgeEvolutionValidationResult,
  KnowledgeGovernanceContract,
  KnowledgeLifecycleState,
  KnowledgeType,
  KnowledgeVersioningContract,
} from "@/types/knowledge-evolution-contract";

const VERSION = "knowledge-evolution-contract/v8ALT.9.1" as const;
const NOW = "2026-07-16T00:00:00.000Z";
const lifecycle = Object.freeze(["CAPTURED", "NORMALIZED", "ANALYZED", "VALIDATED", "CERTIFIED", "APPROVED", "ACTIVE", "SUPERSEDED", "ARCHIVED", "REJECTED"] as const);
const knowledgeTypes = Object.freeze(["PLANNING_TEMPLATE", "EXECUTION_HEURISTIC", "RECOVERY_TEMPLATE", "CONFIDENCE_REFINEMENT", "RECOMMENDATION_IMPROVEMENT"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: KnowledgeEvolutionScenario): KnowledgeEvolutionFailure | null {
  const map: Partial<Record<KnowledgeEvolutionScenario, KnowledgeEvolutionFailure>> = {
    GOVERNANCE_BYPASS_ATTEMPTED: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_MODIFICATION_ATTEMPTED: "CONSTITUTIONAL_MODIFICATION_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPTED: "AUTHORITY_ESCALATION_DETECTED",
    REPLAY_MUTATION_ATTEMPTED: "REPLAY_MUTATION_DETECTED",
    MISSION_HISTORY_REWRITE_ATTEMPTED: "MISSION_HISTORY_REWRITE_DETECTED",
    AUDIT_RECORD_DELETION_ATTEMPTED: "AUDIT_RECORD_DELETION_DETECTED",
    CROSS_TENANT_CONTAMINATION_ATTEMPTED: "CROSS_TENANT_CONTAMINATION_DETECTED",
    ACTIVATION_WITHOUT_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_MISSING",
    MUTABLE_VERSION_ATTEMPTED: "MUTABLE_VERSION_DETECTED",
    MISSING_EVIDENCE_LINEAGE: "EVIDENCE_LINEAGE_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_LEARNING_ARTIFACT: "HIDDEN_LEARNING_ARTIFACT_DETECTED",
  };
  return map[scenario] ?? null;
}

function governanceContract(scenario: KnowledgeEvolutionScenario): KnowledgeGovernanceContract {
  return Object.freeze({
    governance_validation: scenario === "GOVERNANCE_BYPASS_ATTEMPTED" ? "FAIL" : "PASS",
    constitutional_validation: scenario === "CONSTITUTIONAL_MODIFICATION_ATTEMPTED" ? "FAIL" : "PASS",
    authority_validation: scenario === "AUTHORITY_ESCALATION_ATTEMPTED" ? "FAIL" : "PASS",
    replay_validation: scenario === "REPLAY_MUTATION_ATTEMPTED" ? "FAIL" : "PASS",
    integrity_validation: scenario === "INTEGRITY_FAILURE" ? "FAIL" : "PASS",
    tenant_isolation: scenario === "CROSS_TENANT_CONTAMINATION_ATTEMPTED" ? "FAIL" : "PASS",
    operator_approval_required: true,
  });
}

function activationContract(scenario: KnowledgeEvolutionScenario): KnowledgeActivationContract {
  return Object.freeze({
    approval_required: true,
    approval_reference: scenario === "ACTIVATION_WITHOUT_OPERATOR_APPROVAL" ? null : null,
    activation_timestamp: null,
    activation_state: scenario === "ACTIVATION_WITHOUT_OPERATOR_APPROVAL" ? "ACTIVE" : "NOT_APPROVED",
    activation_authority: false,
    learning_execution_authorized: false,
  });
}

function versioningContract(scenario: KnowledgeEvolutionScenario): KnowledgeVersioningContract {
  return Object.freeze({
    parent_version: null,
    child_versions: freezeArray([]),
    evolution_history: scenario === "HIDDEN_LEARNING_ARTIFACT" ? freezeArray(["CAPTURED", "CERTIFIED"] as KnowledgeLifecycleState[]) : lifecycle,
    replay_reference: scenario === "REPLAY_MUTATION_ATTEMPTED" ? "replay:mutated" : "replay:knowledge-evolution-contract",
    immutable_version: scenario !== "MUTABLE_VERSION_ATTEMPTED",
    append_only: true,
  });
}

function buildArtifact(scenario: KnowledgeEvolutionScenario): KnowledgeArtifactRecord {
  const governance = governanceContract(scenario);
  const activation = activationContract(scenario);
  const lineage = versioningContract(scenario);
  const base = {
    identity: Object.freeze({ knowledge_id: id("KE", "knowledge-artifact", scenario), knowledge_name: "Knowledge Evolution Contract Artifact", knowledge_type: "PLANNING_TEMPLATE" as const, knowledge_category: "PLANNING" as const, version: "1.0.0", lifecycle_state: "CAPTURED" as const, certification_state: "UNCERTIFIED" as const }),
    priority: "HIGH" as const,
    impact_level: "MODERATE" as const,
    origin: Object.freeze({ mission_id: "mission:knowledge-evolution:contract", execution_id: "execution:knowledge-evolution:contract", planning_id: "planning:knowledge-evolution:contract", replay_id: "replay:knowledge-evolution:contract", tenant_id: scenario === "CROSS_TENANT_CONTAMINATION_ATTEMPTED" ? "tenant:foreign" : "tenant:alpha", operator_session_id: "operator:session:knowledge-evolution" }),
    knowledge_sources: freezeArray(["completed missions", "planning history", "execution history", "recovery history", "governance history", "replay history", "confidence history", "optimization history"]),
    evidence: Object.freeze({ evidence_ids: scenario === "MISSING_EVIDENCE_LINEAGE" ? freezeArray([]) : freezeArray(["evidence:mission", "evidence:planning", "evidence:replay"]), evidence_hashes: scenario === "MISSING_EVIDENCE_LINEAGE" ? freezeArray([]) : freezeArray(["hash:mission", "hash:planning", "hash:replay"]), evidence_lineage: scenario === "MISSING_EVIDENCE_LINEAGE" ? freezeArray([]) : freezeArray(["lineage:mission", "lineage:planning", "lineage:replay"]), evidence_quality: 0.97, evidence_confidence: 0.96 }),
    governance,
    certification_timestamp: null,
    activation,
    lineage,
    explainability: freezeArray(["why artifact exists", "contributing mission evidence", "governance influence", "confidence reasoning", "rejected alternatives"]),
    advisory_only: true as const,
    self_modification_allowed: false as const,
    historical_truth_mutable: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("knowledge-artifact", base) });
}

function collectFailures(contract: Omit<KnowledgeEvolutionContract, "integrity_hash"> | KnowledgeEvolutionContract): readonly KnowledgeEvolutionFailure[] {
  const artifact = contract.artifact_schema;
  const expectedLifecycle = lifecycle.join("|");
  return unique([
    ...contract.failures,
    ...(artifact.governance.governance_validation === "FAIL" ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(artifact.governance.constitutional_validation === "FAIL" ? ["CONSTITUTIONAL_MODIFICATION_DETECTED" as const] : []),
    ...(artifact.governance.authority_validation === "FAIL" ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(artifact.governance.replay_validation === "FAIL" || artifact.lineage.replay_reference.includes("mutated") ? ["REPLAY_MUTATION_DETECTED" as const] : []),
    ...(artifact.historical_truth_mutable ? ["MISSION_HISTORY_REWRITE_DETECTED" as const] : []),
    ...(!artifact.lineage.append_only ? ["AUDIT_RECORD_DELETION_DETECTED" as const] : []),
    ...(artifact.origin.tenant_id !== "tenant:alpha" || artifact.governance.tenant_isolation === "FAIL" ? ["CROSS_TENANT_CONTAMINATION_DETECTED" as const] : []),
    ...(artifact.activation.activation_state === "ACTIVE" && !artifact.activation.approval_reference ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!artifact.lineage.immutable_version ? ["MUTABLE_VERSION_DETECTED" as const] : []),
    ...(artifact.evidence.evidence_lineage.length === 0 ? ["EVIDENCE_LINEAGE_MISSING" as const] : []),
    ...(!artifact.integrity_hash || artifact.governance.integrity_validation === "FAIL" ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(artifact.lineage.evolution_history.join("|") !== expectedLifecycle ? ["HIDDEN_LEARNING_ARTIFACT_DETECTED" as const] : []),
  ]);
}

export function getKnowledgeEvolutionContract(input: KnowledgeEvolutionInput = {}): KnowledgeEvolutionContract {
  if (input.contract) return input.contract;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const artifact = buildArtifact(scenario);
  const source = {
    contract_id: id("KEC", "knowledge-evolution-contract", scenario),
    contract_version: VERSION,
    artifact_schema: artifact,
    lifecycle_model: lifecycle,
    governance_rules: artifact.governance,
    activation_contract: artifact.activation,
    versioning_standard: artifact.lineage,
    constitutional_restrictions: freezeArray(["no constitutional modification", "no governance modification", "no authority policy modification", "no mission history rewrite", "no replay history rewrite", "no evidence deletion", "no audit deletion", "no approval bypass"]),
    tenant_isolation_requirements: freezeArray(["tenant learning isolated", "tenant replay isolated", "tenant evidence isolated", "cross-tenant contamination prohibited"]),
    security_requirements: freezeArray(["signed artifacts", "hashed artifacts", "immutable certified versions", "lineage protection", "audit readiness"]),
    failures: freezeArray(injected ? [injected] : []),
    advisory_only: true as const,
    learning_execution_authorized: false as const,
    activation_authority: false as const,
    operator_approval_required: true as const,
    self_modification_allowed: false as const,
    final_state: "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED" as const,
  };
  const failures = collectFailures(source);
  const contract = { ...source, failures, final_state: failures.length ? "KNOWLEDGE_EVOLUTION_CONTRACT_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...contract, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("knowledge-evolution-contract", contract) });
}

export function getKnowledgeArtifactSchema(input: KnowledgeEvolutionInput = {}) { return getKnowledgeEvolutionContract(input).artifact_schema; }
export function getKnowledgeLifecycleModel(input: KnowledgeEvolutionInput = {}) { return getKnowledgeEvolutionContract(input).lifecycle_model; }
export function getKnowledgeGovernanceRules(input: KnowledgeEvolutionInput = {}) { return getKnowledgeEvolutionContract(input).governance_rules; }
export function getKnowledgeActivationContract(input: KnowledgeEvolutionInput = {}) { return getKnowledgeEvolutionContract(input).activation_contract; }

export function validateKnowledgeEvolutionContract(contract = getKnowledgeEvolutionContract()): KnowledgeEvolutionValidationResult {
  const failures = unique([...collectFailures(contract), ...(!contract.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: KnowledgeEvolutionFailure) => failures.includes(failure);
  const valid = failures.length === 0 && contract.final_state === "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED" && contract.advisory_only && !contract.learning_execution_authorized && !contract.activation_authority && !contract.self_modification_allowed;
  const source = {
    contract_id: contract.contract_id,
    valid,
    deterministic_schema_defined: Boolean(contract.artifact_schema.identity.knowledge_id),
    lifecycle_immutable: !has("MUTABLE_VERSION_DETECTED") && contract.lifecycle_model.join("|") === lifecycle.join("|"),
    evidence_lineage_complete: !has("EVIDENCE_LINEAGE_MISSING"),
    governance_enforced: !has("GOVERNANCE_BYPASS_DETECTED"),
    constitutional_compliant: !has("CONSTITUTIONAL_MODIFICATION_DETECTED"),
    authority_preserved: !has("AUTHORITY_ESCALATION_DETECTED"),
    replay_preserved: !has("REPLAY_MUTATION_DETECTED"),
    historical_truth_preserved: !has("MISSION_HISTORY_REWRITE_DETECTED"),
    audit_records_preserved: !has("AUDIT_RECORD_DELETION_DETECTED"),
    tenant_isolated: !has("CROSS_TENANT_CONTAMINATION_DETECTED"),
    operator_approval_required: true as const,
    advisory_only: true as const,
    learning_execution_authorization_absent: !contract.learning_execution_authorized,
    activation_authority_absent: !contract.activation_authority,
    self_modification_absent: !contract.self_modification_allowed,
    fail_closed: valid || failures.length > 0 || contract.final_state !== "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED",
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("knowledge-evolution-validation", source) });
}

export function buildKnowledgeEvolutionObservabilitySurface(contract = getKnowledgeEvolutionContract()): KnowledgeEvolutionObservabilitySurface {
  return Object.freeze({ contract_id: contract.contract_id, final_state: contract.final_state, lifecycle_state_count: contract.lifecycle_model.length, failure_count: contract.failures.length, advisory_only: true, learning_execution_authorized: false, activation_authority: false, integrity_hash: contract.integrity_hash });
}

export function getKnowledgeEvolutionContractBundle(): KnowledgeEvolutionContractBundle {
  const contract = getKnowledgeEvolutionContract();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED", lifecycle, knowledge_types: knowledgeTypes as readonly KnowledgeType[], principles: freezeArray(["contract-only", "deterministic-processing", "replay-fidelity", "governance-enforcement", "constitutional-compliance", "operator-authority", "immutable-lineage", "tenant-isolation", "no-self-modification", "activation-requires-operator-approval"]) }),
    contract,
    validation: validateKnowledgeEvolutionContract(contract),
    observability: buildKnowledgeEvolutionObservabilitySurface(contract),
  });
}
