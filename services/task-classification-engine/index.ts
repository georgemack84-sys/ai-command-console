import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildDelegationContract, computeDelegationIntegrityHash, validateDelegationContract } from "@/services/delegation-contract";
import type { DelegationContract, DelegationContractScenario, DelegationDelegateType } from "@/types/delegation-contract";
import type {
  TaskClassificationDecision,
  TaskClassificationFailureReason,
  TaskClassificationFramework,
  TaskClassificationPackage,
  TaskClassificationReplayResult,
  TaskClassificationRule,
  TaskClassificationScenario,
  TaskClassificationValidationResult,
  TaskClassificationVisibilitySurface,
  TaskDecisionMatrixEntry,
  TaskEvaluationEvidence,
  TaskExecutionCategory,
} from "@/types/task-classification-engine";

const NOW = "2026-06-29T14:00:00.000Z";
const ENGINE_VERSION = "task-classification-engine/v8D.2" as const;
const RULE_VERSION = "task-classification-rule/v8D.2" as const;

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

function rule(rule_name: string, condition: string, classification: TaskExecutionCategory, priority: number): TaskClassificationRule {
  const source = { rule_id: id("TCR", "task-classification-rule-id", { rule_name, classification, priority }), rule_name, condition, classification, priority, version: RULE_VERSION, immutable: true as const, replay_compatible: true as const };
  return Object.freeze({ ...source, rule_hash: hashValue("task-classification-rule", source) });
}

export function getTaskClassificationRuleLibrary(): readonly TaskClassificationRule[] {
  return freezeArray([
    rule("operator judgment", "human judgment, approval, governance review, constitutional interpretation, or risk acceptance required", "OPERATOR", 10),
    rule("blocked governance failure", "authority missing, policy conflict, constitutional restriction, tenant failure, or integrity failure detected", "BLOCKED", 20),
    rule("defer prerequisites", "dependency incomplete, approval pending, schedule unavailable, resource unavailable, or governance review pending", "DEFERRED", 30),
    rule("external routing", "enterprise integration, external API, cloud infrastructure, or third-party coordination required", "EXTERNAL", 40),
    rule("certified autonomous capability", "certified capability, approved authority, deterministic execution, governance approval, and replay support available", "AGENT", 50),
  ]);
}

function matrixEntry(condition: TaskDecisionMatrixEntry["condition"], classification: TaskExecutionCategory, explanation: string): TaskDecisionMatrixEntry {
  const source = { matrix_entry_id: id("TCM", "task-classification-matrix-entry-id", { condition, classification }), condition, classification, explanation };
  return Object.freeze({ ...source, entry_hash: hashValue("task-classification-matrix-entry", source) });
}

export function getTaskClassificationDecisionMatrix(): readonly TaskDecisionMatrixEntry[] {
  return freezeArray([
    matrixEntry("HUMAN_JUDGMENT_REQUIRED", "OPERATOR", "Human judgment or approval preserves operator supremacy."),
    matrixEntry("CERTIFIED_CAPABILITY_AVAILABLE", "AGENT", "Certified deterministic capability may perform governed autonomous work."),
    matrixEntry("EXTERNAL_SERVICE_REQUIRED", "EXTERNAL", "Approved outside systems require external routing and audit logging."),
    matrixEntry("DEPENDENCY_INCOMPLETE", "DEFERRED", "Incomplete prerequisites preserve state until deterministic reevaluation."),
    matrixEntry("AUTHORITY_OR_POLICY_FAILURE", "BLOCKED", "Authority, policy, governance, constitutional, tenant, or integrity failures prohibit execution."),
  ]);
}

function delegationScenarioFor(scenario: TaskClassificationScenario): DelegationContractScenario {
  if (scenario === "OPERATOR_REQUIRED") return "MISSING_OPERATOR_APPROVAL";
  if (scenario === "AUTHORITY_FAILURE") return "MISSING_AUTHORITY";
  if (scenario === "UNCERTIFIED_AGENT") return "UNCERTIFIED_DELEGATE";
  if (scenario === "POLICY_CONFLICT") return "POLICY_VIOLATION";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "CROSS_TENANT_ROUTING") return "TENANT_MISMATCH";
  if (scenario === "REPLAY_INCONSISTENCY") return "REPLAY_CORRUPTION";
  if (scenario === "INVALID_DELEGATION_CONTRACT") return "MISSING_TASK";
  return "BASELINE";
}

function targetOverride(contract: DelegationContract, scenario: TaskClassificationScenario): DelegationContract {
  if (scenario !== "EXTERNAL_REQUIRED") return contract;
  const updated = {
    ...contract,
    target: {
      ...contract.target,
      delegate_type: "EXTERNAL_SYSTEM" as const,
      delegate_id: "external:enterprise-api",
      delegate_role: "approved enterprise integration",
      registered: true,
      certified: true,
      authorized: true,
      suspended: false,
      routing_eligible: true,
    },
  };
  return Object.freeze({ ...updated, integrity_hash: computeDelegationIntegrityHash(updated) });
}

function categoryFor(contract: DelegationContract, scenario: TaskClassificationScenario): TaskExecutionCategory {
  if (["AUTHORITY_FAILURE", "UNCERTIFIED_AGENT", "POLICY_CONFLICT", "CONSTITUTIONAL_VIOLATION", "CROSS_TENANT_ROUTING", "INVALID_DELEGATION_CONTRACT"].includes(scenario)) return "BLOCKED";
  if (scenario === "DEPENDENCY_INCOMPLETE") return "DEFERRED";
  if (scenario === "OPERATOR_REQUIRED" || contract.target.delegate_type === "OPERATOR") return "OPERATOR";
  if (scenario === "EXTERNAL_REQUIRED" || contract.target.delegate_type === "EXTERNAL_SYSTEM") return "EXTERNAL";
  if (contract.target.delegate_type === "DEFERRED") return "DEFERRED";
  if (contract.target.delegate_type === "BLOCKED") return "BLOCKED";
  return "AGENT";
}

function ownerTypeFor(category: TaskExecutionCategory, contract: DelegationContract): DelegationDelegateType {
  if (category === "AGENT" && contract.target.delegate_type === "AUTONOMY_ENGINE") return "AUTONOMY_ENGINE";
  if (category === "AGENT") return "INTERNAL_AGENT";
  if (category === "EXTERNAL") return "EXTERNAL_SYSTEM";
  if (category === "OPERATOR") return "OPERATOR";
  if (category === "DEFERRED") return "DEFERRED";
  return "BLOCKED";
}

function buildEvidence(contract: DelegationContract, category: TaskExecutionCategory, scenario: TaskClassificationScenario): TaskEvaluationEvidence {
  const source = {
    evidence_id: id("TCE", "task-classification-evidence-id", { delegation: contract.identity.delegation_id, scenario }),
    task_complexity: category === "OPERATOR" || category === "EXTERNAL" ? "HIGH" as const : "MEDIUM" as const,
    required_authority: contract.authority.authority_level,
    governance_policy: contract.authority.governing_policy,
    constitutional_reference: contract.authority.constitutional_reference,
    agent_capability: category === "AGENT" ? "certified:deterministic-orchestration" : "",
    external_dependency: category === "EXTERNAL" ? "external:enterprise-api" : null,
    execution_timing: scenario === "DEPENDENCY_INCOMPLETE" ? "WAITING" as const : "READY" as const,
    risk_level: category === "BLOCKED" ? "CRITICAL" as const : category === "OPERATOR" || category === "EXTERNAL" ? "HIGH" as const : "MEDIUM" as const,
    dependency_readiness: scenario === "INCOMPLETE_DEPENDENCY_ANALYSIS" ? "UNKNOWN" as const : scenario === "DEPENDENCY_INCOMPLETE" ? "INCOMPLETE" as const : "COMPLETE" as const,
    operator_involvement: category === "OPERATOR" || contract.authority.approval_required,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("task-classification-evidence", source) });
}

function confidenceFor(category: TaskExecutionCategory, scenario: TaskClassificationScenario) {
  const score = scenario === "LOW_CONFIDENCE" ? 0.58 : category === "BLOCKED" ? 0.91 : category === "DEFERRED" ? 0.84 : 0.94;
  const level = score >= 0.85 ? "HIGH" as const : score >= 0.7 ? "MEDIUM" as const : score >= 0.45 ? "LOW" as const : "INSUFFICIENT" as const;
  return Object.freeze({
    score,
    level,
    factors: freezeArray(["authority certainty", "capability certainty", "dependency completeness", "governance certainty", "policy clarity", "historical consistency", "replay consistency", "execution readiness"]),
  });
}

function matchedRules(category: TaskExecutionCategory, rules: readonly TaskClassificationRule[], scenario: TaskClassificationScenario): readonly string[] {
  if (scenario === "AMBIGUOUS_CLASSIFICATION") return freezeArray(rules.filter((item) => item.classification === "AGENT" || item.classification === "OPERATOR").map((item) => item.rule_id));
  if (scenario === "MULTIPLE_OWNERS") return freezeArray(rules.filter((item) => item.classification === "AGENT" || item.classification === "EXTERNAL").map((item) => item.rule_id));
  return freezeArray(rules.filter((item) => item.classification === category).map((item) => item.rule_id));
}

export function computeTaskClassificationDecisionHash(decision: Omit<TaskClassificationDecision, "integrity_hash"> | TaskClassificationDecision): string {
  return hashValue("task-classification-decision", {
    classification_id: decision.classification_id,
    task_id: decision.task_id,
    delegation_id: decision.delegation_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    classification: decision.classification,
    execution_owner_type: decision.execution_owner_type,
    execution_owner_id: decision.execution_owner_id,
    classification_state: decision.classification_state,
    matched_rule_ids: decision.matched_rule_ids,
    evidence_hash: decision.evidence.evidence_hash,
    authority_validation: decision.authority_validation,
    policy_references: decision.policy_references,
    dependency_analysis: decision.dependency_analysis,
    confidence: decision.confidence,
    governance_outcome: decision.governance_outcome,
    explanation: decision.explanation,
    timestamp: decision.timestamp,
    replay_reference: decision.replay_reference,
    lineage_reference: decision.lineage_reference,
  });
}

export function classifyDelegationTask(input: { scenario?: TaskClassificationScenario; delegation?: DelegationContract } = {}): TaskClassificationDecision {
  const scenario = input.scenario ?? "BASELINE";
  const sourceDelegation = input.delegation ?? buildDelegationContract({ scenario: delegationScenarioFor(scenario) });
  const delegation = targetOverride(sourceDelegation, scenario);
  const delegationValidation = validateDelegationContract(delegation);
  const rules = getTaskClassificationRuleLibrary();
  const category = categoryFor(delegation, scenario);
  const evidence = buildEvidence(delegation, category, scenario);
  const confidence = confidenceFor(category, scenario);
  const ownerType = ownerTypeFor(category, delegation);
  const mappedFailures: TaskClassificationFailureReason[] = delegationValidation.failures.flatMap((item) => {
    if (item.reason === "MISSING_AUTHORITY") return ["MISSING_AUTHORITY"];
    if (item.reason === "UNCERTIFIED_DELEGATE") return ["UNCERTIFIED_AGENT"];
    if (item.reason === "POLICY_VIOLATION") return ["POLICY_CONFLICT"];
    if (item.reason === "CONSTITUTIONAL_VIOLATION") return ["CONSTITUTIONAL_VIOLATION"];
    if (item.reason === "TENANT_MISMATCH") return ["CROSS_TENANT_ROUTING"];
    if (item.reason === "REPLAY_REFERENCE_CORRUPTION") return ["REPLAY_INCONSISTENCY"];
    return [];
  });
  if (scenario === "NONDETERMINISTIC_DECISION") mappedFailures.push("NONDETERMINISTIC_DECISION");
  const failures = unique(mappedFailures);
  const governanceAlerts = category === "BLOCKED" ? freezeArray(["classification:blocking-condition:evidence-recorded"]) : freezeArray<string>([]);
  const base = {
    classification_id: id("TCD", "task-classification-id", { delegation: delegation.identity.delegation_id, category, scenario }),
    task_id: delegation.identity.task_id,
    delegation_id: delegation.identity.delegation_id,
    tenant_id: scenario === "CROSS_TENANT_ROUTING" ? "tenant_gamma" : delegation.identity.tenant_id,
    mission_id: delegation.identity.mission_id,
    classification: category,
    execution_owner_type: ownerType,
    execution_owner_id: category === "DEFERRED" ? "deferred:dependency" : category === "BLOCKED" ? "blocked:governance" : delegation.target.delegate_id,
    classification_state: category === "DEFERRED" ? "DEFERRED" as const : category === "BLOCKED" ? "BLOCKED" as const : "READY_FOR_DELEGATION" as const,
    matched_rule_ids: matchedRules(category, rules, scenario),
    evidence,
    authority_validation: Object.freeze({
      authority_valid: delegationValidation.authority_valid && category !== "BLOCKED",
      authority_reference: delegation.lifecycle.transition_history[0]?.authority_reference ?? "",
      failures,
    }),
    policy_references: freezeArray([delegation.authority.governing_policy, delegation.governance.governance_reference].filter(Boolean)),
    dependency_analysis: Object.freeze({
      dependencies_complete: scenario !== "DEPENDENCY_INCOMPLETE",
      dependency_refs: scenario === "INCOMPLETE_DEPENDENCY_ANALYSIS" ? freezeArray<string>([]) : freezeArray([`dependency:${delegation.identity.task_id}`]),
      deferred_reason: scenario === "DEPENDENCY_INCOMPLETE" ? "dependency incomplete" : null,
    }),
    confidence,
    governance_outcome: Object.freeze({
      approved: category !== "BLOCKED" && scenario !== "LOW_CONFIDENCE",
      alerts: governanceAlerts,
      review_required: category === "OPERATOR" || category === "BLOCKED" || confidence.level === "LOW" || confidence.level === "INSUFFICIENT",
    }),
    explanation: `Task ${delegation.identity.task_id} classified as ${category} by deterministic Phase 8D.2 rules.`,
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_INCONSISTENCY" ? "" : `classification:${delegation.metadata.replay_reference}`,
    lineage_reference: delegation.metadata.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-classification-hash" : computeTaskClassificationDecisionHash(base) });
}

function validateClassificationDecision(decision: TaskClassificationDecision, delegation: DelegationContract): TaskClassificationValidationResult {
  const failures: TaskClassificationFailureReason[] = [];
  if (validateDelegationContract(delegation).validation_state === "FAIL" && decision.classification !== "BLOCKED") failures.push("INVALID_DELEGATION_CONTRACT");
  if (!decision.execution_owner_id) failures.push("MULTIPLE_EXECUTION_OWNERS");
  const matchedCategories = getTaskClassificationRuleLibrary().filter((ruleItem) => decision.matched_rule_ids.includes(ruleItem.rule_id)).map((ruleItem) => ruleItem.classification);
  if (new Set(matchedCategories).size > 1) failures.push("MULTIPLE_EXECUTION_OWNERS");
  if (new Set(matchedCategories).size !== 1 || matchedCategories[0] !== decision.classification) failures.push("AMBIGUOUS_CLASSIFICATION");
  if (!decision.authority_validation.authority_valid && decision.classification !== "BLOCKED" && decision.classification !== "DEFERRED") failures.push("MISSING_AUTHORITY");
  if (decision.authority_validation.failures.includes("UNCERTIFIED_AGENT")) failures.push("UNCERTIFIED_AGENT");
  if (decision.authority_validation.failures.includes("POLICY_CONFLICT")) failures.push("POLICY_CONFLICT");
  if (decision.authority_validation.failures.includes("CONSTITUTIONAL_VIOLATION")) failures.push("CONSTITUTIONAL_VIOLATION");
  if (decision.tenant_id !== delegation.identity.tenant_id) failures.push("CROSS_TENANT_ROUTING");
  if (!decision.replay_reference) failures.push("REPLAY_INCONSISTENCY");
  if (decision.evidence.dependency_readiness === "UNKNOWN" || decision.dependency_analysis.dependency_refs.length === 0) failures.push("INCOMPLETE_DEPENDENCY_ANALYSIS");
  if (decision.authority_validation.failures.includes("NONDETERMINISTIC_DECISION")) failures.push("NONDETERMINISTIC_DECISION");
  if (!decision.governance_outcome.approved && !decision.governance_outcome.review_required && decision.classification !== "BLOCKED") failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (computeTaskClassificationDecisionHash(decision) !== decision.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = unique(failures);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { classification: decision.classification_id, validation_state, uniqueFailures };
  return Object.freeze({
    validation_id: id("TCV", "task-classification-validation-id", source),
    classification_id: decision.classification_id,
    validation_state,
    failures: uniqueFailures,
    exactly_one_owner: !uniqueFailures.includes("MULTIPLE_EXECUTION_OWNERS") && !uniqueFailures.includes("AMBIGUOUS_CLASSIFICATION"),
    authority_validated: !uniqueFailures.includes("MISSING_AUTHORITY"),
    capability_validated: !uniqueFailures.includes("UNCERTIFIED_AGENT"),
    dependency_analysis_complete: !uniqueFailures.includes("INCOMPLETE_DEPENDENCY_ANALYSIS"),
    governance_validated: !uniqueFailures.includes("GOVERNANCE_VALIDATION_FAILED") && !uniqueFailures.includes("POLICY_CONFLICT") && !uniqueFailures.includes("CONSTITUTIONAL_VIOLATION"),
    confidence_present: decision.confidence.score > 0,
    replay_ready: !uniqueFailures.includes("REPLAY_INCONSISTENCY"),
    lineage_complete: Boolean(decision.lineage_reference),
    integrity_verified: !uniqueFailures.includes("INTEGRITY_HASH_MISMATCH"),
    ready_for_authority_validation_engine: validation_state === "PASS" && decision.classification !== "DEFERRED" && decision.classification !== "BLOCKED",
    validation_hash: hashValue("task-classification-validation", source),
  });
}

function replayClassification(decision: TaskClassificationDecision, validation: TaskClassificationValidationResult): TaskClassificationReplayResult {
  const source = {
    replay_id: id("TCRP", "task-classification-replay-id", decision.classification_id),
    classification_id: decision.classification_id,
    reconstructed_classification: decision.classification,
    reconstructed_owner_id: decision.execution_owner_id,
    reconstructed_rule_ids: decision.matched_rule_ids,
    reconstructed_evidence_hash: decision.evidence.evidence_hash,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("task-classification-replay", source) });
}

export function buildTaskClassificationPackage(input: { scenario?: TaskClassificationScenario; delegation?: DelegationContract } = {}): TaskClassificationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_delegation = targetOverride(input.delegation ?? buildDelegationContract({ scenario: delegationScenarioFor(scenario) }), scenario);
  const classification = classifyDelegationTask({ scenario, delegation: source_delegation });
  const validation = validateClassificationDecision(classification, source_delegation);
  const replay = replayClassification(classification, validation);
  const source = {
    package_id: id("TCP", "task-classification-package-id", classification.classification_id),
    engine_version: ENGINE_VERSION,
    source_delegation,
    rule_library: getTaskClassificationRuleLibrary(),
    decision_matrix: getTaskClassificationDecisionMatrix(),
    classification,
    validation,
    replay,
    immutable_evidence_refs: freezeArray([classification.evidence.evidence_hash, classification.integrity_hash, replay.replay_hash]),
  };
  return Object.freeze({ ...source, package_hash: hashValue("task-classification-package", source) });
}

export function buildTaskClassificationVisibilitySurface(pkg = buildTaskClassificationPackage()): TaskClassificationVisibilitySurface {
  return Object.freeze({
    classification_id: pkg.classification.classification_id,
    task_id: pkg.classification.task_id,
    classification: pkg.classification.classification,
    execution_owner_id: pkg.classification.execution_owner_id,
    classification_state: pkg.classification.classification_state,
    confidence_level: pkg.classification.confidence.level,
    review_required: pkg.classification.governance_outcome.review_required,
    governance_alerts: pkg.classification.governance_outcome.alerts,
    failure_reasons: pkg.validation.failures,
    replay_reference: pkg.classification.replay_reference,
    lineage_reference: pkg.classification.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getTaskClassificationFramework(): TaskClassificationFramework {
  const pkg = buildTaskClassificationPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "explainable", "auditable", "governance-enforced", "constitutional-first", "operator-supremacy", "replayable", "lineage-aware", "single-owner", "execution-prohibiting-for-blocked-tasks"]),
      engine_version: ENGINE_VERSION,
      categories: freezeArray(["OPERATOR", "AGENT", "EXTERNAL", "DEFERRED", "BLOCKED"] as const),
      states: freezeArray(["UNCLASSIFIED", "ANALYZING", "AUTHORITY_VALIDATION", "DEPENDENCY_VALIDATION", "CLASSIFIED", "GOVERNANCE_APPROVED", "READY_FOR_DELEGATION", "DEFERRED", "BLOCKED", "INVALID", "REJECTED", "FAILED"] as const),
    }),
    package: pkg,
    visibility: buildTaskClassificationVisibilitySurface(pkg),
  });
}
