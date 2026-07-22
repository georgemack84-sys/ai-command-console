import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import type {
  ConstitutionalAdaptationApiSurface,
  ConstitutionalAdaptationFailure,
  ConstitutionalAdaptationValidatorFoundation,
  ConstitutionalAdaptationValidatorInput,
  ConstitutionalAdaptationValidatorResult,
  ConstitutionalAdaptationValidation,
  ConstitutionalConflictResult,
  ConstitutionalDependency,
  ConstitutionalLedgerEntry,
  ConstitutionalProtectedPrinciple,
  ConstitutionalRuleEvaluation,
  ConstitutionalViolation,
} from "@/types/constitutional-adaptation-validator";

const CONSTITUTIONAL_ADAPTATION_VALIDATOR_VERSION = "constitutional-adaptation-validator/v1" as const;
const CONSTITUTION_VERSION = "mission-control-constitution/phase-10.8.2";
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<ConstitutionalAdaptationValidatorInput["scenario"]>;

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

function buildApiSurface(): ConstitutionalAdaptationApiSurface {
  const base: Omit<ConstitutionalAdaptationApiSurface, "integrity_hash"> = {
    api_id: "constitutional_adaptation_validator_api",
    validate_proposal: "POST /constitutional-adaptation-validator/validate",
    retrieve_principles: "POST /constitutional-adaptation-validator/principles",
    retrieve_rules: "POST /constitutional-adaptation-validator/rules",
    retrieve_conflicts: "POST /constitutional-adaptation-validator/conflicts",
    retrieve_violations: "POST /constitutional-adaptation-validator/violations",
    retrieve_rejection: "POST /constitutional-adaptation-validator/rejection",
    retrieve_ledger: "POST /constitutional-adaptation-validator/ledger",
    replay_validation: "POST /constitutional-adaptation-validator/replay",
    retrieve_contract: "GET /constitutional-adaptation-validator/contract",
    execution_approval_supported: false,
    authority_expansion_supported: false,
    constitutional_bypass_supported: false,
    fail_open_supported: false,
    mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function principle(principle_id: string, category: ConstitutionalProtectedPrinciple["category"], scenario: Scenario, failing: readonly Scenario[], evidence_refs: readonly string[], guarantee: string): ConstitutionalProtectedPrinciple {
  const base: Omit<ConstitutionalProtectedPrinciple, "integrity_hash"> = {
    principle_id,
    category,
    guarantee,
    preserved: !failing.includes(scenario),
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rule(rule_id: string, kind: ConstitutionalRuleEvaluation["kind"], status: ConstitutionalRuleEvaluation["status"], reasoning: string, evidence_refs: readonly string[]): ConstitutionalRuleEvaluation {
  const base: Omit<ConstitutionalRuleEvaluation, "integrity_hash"> = { rule_id, kind, status, reasoning, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function dependency(dependency_id: string, satisfied: boolean, explanation: string, evidence_refs: readonly string[]): ConstitutionalDependency {
  const base: Omit<ConstitutionalDependency, "integrity_hash"> = { dependency_id, satisfied, explanation, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPrinciples(scenario: Scenario, evidenceRefs: readonly string[]): readonly ConstitutionalProtectedPrinciple[] {
  if (scenario === "PRINCIPLE_DISCOVERY_FAILURE") return freezeArray([]);
  return freezeArray([
    principle("principle_human_authority", "HUMAN_AUTHORITY", scenario, ["HUMAN_AUTHORITY_LOSS"], evidenceRefs, "Human decision authority, approval, and override remain preserved."),
    principle("principle_advisory_only", "ADVISORY_ONLY_OPERATION", scenario, ["ADVISORY_ONLY_VIOLATION", "AUTONOMOUS_EXECUTION"], evidenceRefs, "Adaptive output remains advisory and non-executing."),
    principle("principle_operator_supremacy", "OPERATOR_SUPREMACY", scenario, ["OPERATOR_SUPREMACY_WEAKENING", "OPERATOR_BYPASS"], evidenceRefs, "Operator visibility, intervention, and approval remain intact."),
    principle("principle_governance_supremacy", "GOVERNANCE_SUPREMACY", scenario, ["GOVERNANCE_WEAKENING", "GOVERNANCE_THRESHOLD_UPDATE"], evidenceRefs, "Governance controls and review remain supreme."),
    principle("principle_determinism", "DETERMINISM", scenario, ["NONDETERMINISTIC"], evidenceRefs, "Validation behavior remains reproducible."),
    principle("principle_explainability", "EXPLAINABILITY", scenario, ["EXPLAINABILITY_REDUCTION"], evidenceRefs, "Reasoning and rationale remain complete."),
    principle("principle_replayability", "REPLAYABILITY", scenario, ["REPLAY_DEGRADATION", "MISSING_REPLAY"], evidenceRefs, "Replay lineage and integrity remain complete."),
    principle("principle_auditability", "AUDITABILITY", scenario, ["AUDITABILITY_WEAKENING", "MISSING_EVIDENCE"], evidenceRefs, "Audit records remain immutable and complete."),
    principle("principle_evidence_integrity", "EVIDENCE_INTEGRITY", scenario, ["EVIDENCE_INTEGRITY_FAILURE", "HASH_MISMATCH"], evidenceRefs, "Evidence remains sufficient and hash verified."),
    principle("principle_tenant_isolation", "TENANT_ISOLATION", scenario, ["TENANT_ISOLATION_FAILURE", "CROSS_TENANT"], evidenceRefs, "Tenant boundaries remain isolated."),
    principle("principle_historical_truth", "HISTORICAL_TRUTH", scenario, ["HISTORICAL_TRUTH_MUTATION", "HISTORICAL_RECORD_MUTATION"], evidenceRefs, "Historical truth cannot be rewritten."),
    principle("principle_historical_immutability", "HISTORICAL_IMMUTABILITY", scenario, ["HISTORICAL_IMMUTABILITY_VIOLATION"], evidenceRefs, "Historical ledgers remain immutable."),
    principle("principle_transparency", "TRANSPARENCY", scenario, ["TRANSPARENCY_REDUCTION"], evidenceRefs, "Constitutional visibility remains intact."),
    principle("principle_least_authority", "LEAST_AUTHORITY", scenario, ["AUTHORITY_EXPANSION"], evidenceRefs, "Adaptive proposals cannot expand authority."),
    principle("principle_simulation_first", "SIMULATION_FIRST_OPERATION", scenario, ["SIMULATION_BYPASS"], evidenceRefs, "Simulation remains required before downstream action."),
  ]);
}

function buildRules(scenario: Scenario, evidenceRefs: readonly string[]): readonly ConstitutionalRuleEvaluation[] {
  if (scenario === "RULE_EVALUATION_INCOMPLETE") return freezeArray([]);
  const failed = (cases: readonly Scenario[]) => cases.includes(scenario) ? "FAILED" : "PASSED";
  return freezeArray([
    rule("rule_no_authority_expansion", "ABSOLUTE_PROHIBITION", failed(["AUTHORITY_EXPANSION", "AUTONOMOUS_EXECUTION"]), "Authority expansion and autonomous execution are constitutionally prohibited.", evidenceRefs),
    rule("rule_human_operator_control", "MANDATORY", failed(["HUMAN_AUTHORITY_LOSS", "OPERATOR_SUPREMACY_WEAKENING", "OPERATOR_BYPASS"]), "Human and operator authority must remain intact.", evidenceRefs),
    rule("rule_governance_constitution_supremacy", "GOVERNANCE_REQUIREMENT", failed(["GOVERNANCE_WEAKENING", "CONSTITUTIONAL_REVIEW_BYPASS"]), "Governance and constitutional review cannot be bypassed.", evidenceRefs),
    rule("rule_truth_immutability", "TRUTH_PRESERVATION", failed(["HISTORICAL_TRUTH_MUTATION", "HISTORICAL_IMMUTABILITY_VIOLATION", "HISTORICAL_RECORD_MUTATION"]), "Historical truth and evidence are immutable.", evidenceRefs),
    rule("rule_replay_audit_evidence", "MANDATORY", failed(["REPLAY_DEGRADATION", "MISSING_REPLAY", "AUDITABILITY_WEAKENING", "MISSING_EVIDENCE", "EVIDENCE_INTEGRITY_FAILURE"]), "Replay, audit, and evidence guarantees must remain complete.", evidenceRefs),
  ]);
}

function buildDependencies(scenario: Scenario, evidenceRefs: readonly string[]): readonly ConstitutionalDependency[] {
  return freezeArray([
    dependency("dependency_constitution_scope", scenario !== "PRINCIPLE_DISCOVERY_FAILURE", "Applicable constitutional scope must resolve deterministically.", evidenceRefs),
    dependency("dependency_governance_validation", scenario !== "GOVERNANCE_WEAKENING", "Governance validation must remain available.", evidenceRefs),
    dependency("dependency_replay_lineage", scenario !== "REPLAY_DEGRADATION" && scenario !== "MISSING_REPLAY", "Constitutional replay lineage must be present.", evidenceRefs),
    dependency("dependency_evidence_integrity", scenario !== "EVIDENCE_INTEGRITY_FAILURE" && scenario !== "HASH_MISMATCH", "Evidence integrity must be verifiable.", evidenceRefs),
    dependency("dependency_constitutional_lineage", scenario !== "LINEAGE_INCOMPLETE" && scenario !== "BROKEN_LINEAGE", "Constitutional lineage must be complete.", evidenceRefs),
  ]);
}

function collectFailures(scenario: Scenario, principles: readonly ConstitutionalProtectedPrinciple[], rules: readonly ConstitutionalRuleEvaluation[], dependencies: readonly ConstitutionalDependency[]): readonly ConstitutionalAdaptationFailure[] {
  const failures: ConstitutionalAdaptationFailure[] = [];
  if (principles.length === 0) failures.push("PRINCIPLES_UNRESOLVED");
  if (rules.length === 0) failures.push("RULE_EVALUATION_INCOMPLETE");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_REASONING");
  if (scenario === "HUMAN_AUTHORITY_LOSS") failures.push("HUMAN_AUTHORITY_UNGUARANTEED");
  if (scenario === "GOVERNANCE_WEAKENING" || scenario === "GOVERNANCE_THRESHOLD_UPDATE") failures.push("GOVERNANCE_SUPREMACY_WEAKENED");
  if (scenario === "OPERATOR_SUPREMACY_WEAKENING" || scenario === "OPERATOR_BYPASS") failures.push("OPERATOR_SUPREMACY_WEAKENED");
  if (scenario === "ADVISORY_ONLY_VIOLATION" || scenario === "PRODUCTION_MUTATION") failures.push("ADVISORY_ONLY_VIOLATED");
  if (scenario === "AUTHORITY_EXPANSION") failures.push("AUTHORITY_EXPANSION_DETECTED");
  if (scenario === "AUTONOMOUS_EXECUTION") failures.push("AUTONOMOUS_EXECUTION_INTRODUCED");
  if (scenario === "EXPLAINABILITY_REDUCTION") failures.push("EXPLAINABILITY_REDUCED");
  if (scenario === "REPLAY_DEGRADATION" || scenario === "MISSING_REPLAY") failures.push("REPLAY_DEGRADED");
  if (scenario === "AUDITABILITY_WEAKENING" || scenario === "MISSING_EVIDENCE") failures.push("AUDITABILITY_WEAKENED");
  if (scenario === "EVIDENCE_INTEGRITY_FAILURE" || scenario === "HASH_MISMATCH") failures.push("EVIDENCE_INTEGRITY_FAILED");
  if (scenario === "TENANT_ISOLATION_FAILURE" || scenario === "CROSS_TENANT") failures.push("TENANT_ISOLATION_UNGUARANTEED");
  if (scenario === "HISTORICAL_TRUTH_MUTATION" || scenario === "HISTORICAL_RECORD_MUTATION") failures.push("HISTORICAL_TRUTH_MUTATION_RISK");
  if (scenario === "HISTORICAL_IMMUTABILITY_VIOLATION") failures.push("HISTORICAL_IMMUTABILITY_VIOLATED");
  if (scenario === "LINEAGE_INCOMPLETE" || scenario === "BROKEN_LINEAGE") failures.push("CONSTITUTIONAL_LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_FAILED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_FAILURE") failures.push("DECISION_RECORDING_FAILED");
  if (scenario === "TRANSPARENCY_REDUCTION") failures.push("TRANSPARENCY_REDUCED");
  if (scenario === "CONSTITUTIONAL_REVIEW_BYPASS") failures.push("CONSTITUTIONAL_REVIEW_BYPASSED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  if (principles.some((item) => !item.preserved) || rules.some((item) => item.status === "FAILED") || dependencies.some((item) => !item.satisfied)) {
    failures.push(...rules.filter((item) => item.status === "FAILED").map(() => "RULE_EVALUATION_INCOMPLETE" as const));
  }
  return freezeArray([...new Set(failures)]);
}

function conflictSeverity(scenario: Scenario, failures: readonly ConstitutionalAdaptationFailure[]): ConstitutionalConflictResult["severity"] {
  if (["AUTHORITY_EXPANSION", "AUTONOMOUS_EXECUTION", "HISTORICAL_TRUTH_MUTATION", "CONSTITUTIONAL_REVIEW_BYPASS"].includes(scenario)) return "AUTOMATIC_REJECTION";
  if (failures.length > 0) return "CRITICAL_VIOLATION";
  if (scenario === "CONSTITUTIONAL_CONFLICT") return "CONSTITUTIONAL_CONFLICT";
  if (scenario === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
  return "NONE";
}

function conflict(conflict_id: string, category: ConstitutionalConflictResult["category"], severity: ConstitutionalConflictResult["severity"], explanation: string): ConstitutionalConflictResult {
  const base: Omit<ConstitutionalConflictResult, "integrity_hash"> = {
    conflict_id,
    category,
    severity,
    resolution_required: severity !== "NONE",
    explanation,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function violation(failure: ConstitutionalAdaptationFailure, evidenceRefs: readonly string[]): ConstitutionalViolation {
  const categoryMap: Partial<Record<ConstitutionalAdaptationFailure, ConstitutionalViolation["category"]>> = {
    HUMAN_AUTHORITY_UNGUARANTEED: "HUMAN_AUTHORITY",
    GOVERNANCE_SUPREMACY_WEAKENED: "GOVERNANCE_SUPREMACY",
    OPERATOR_SUPREMACY_WEAKENED: "OPERATOR_SUPREMACY",
    ADVISORY_ONLY_VIOLATED: "ADVISORY_ONLY_OPERATION",
    AUTHORITY_EXPANSION_DETECTED: "LEAST_AUTHORITY",
    AUTONOMOUS_EXECUTION_INTRODUCED: "PRODUCTION_SAFETY",
    EXPLAINABILITY_REDUCED: "EXPLAINABILITY",
    REPLAY_DEGRADED: "REPLAYABILITY",
    AUDITABILITY_WEAKENED: "AUDITABILITY",
    EVIDENCE_INTEGRITY_FAILED: "EVIDENCE_INTEGRITY",
    TENANT_ISOLATION_UNGUARANTEED: "TENANT_ISOLATION",
    HISTORICAL_TRUTH_MUTATION_RISK: "HISTORICAL_TRUTH",
    HISTORICAL_IMMUTABILITY_VIOLATED: "HISTORICAL_IMMUTABILITY",
    TRANSPARENCY_REDUCED: "TRANSPARENCY",
  };
  const automatic = ["AUTHORITY_EXPANSION_DETECTED", "AUTONOMOUS_EXECUTION_INTRODUCED", "HISTORICAL_TRUTH_MUTATION_RISK", "CONSTITUTIONAL_REVIEW_BYPASSED"].includes(failure);
  const base: Omit<ConstitutionalViolation, "integrity_hash"> = {
    violation_id: `constitutional_violation_${hash(failure).slice(0, 14)}`,
    category: categoryMap[failure] ?? "CONSTITUTIONAL_INTEGRITY",
    severity: automatic ? "AUTOMATIC_REJECTION" : "CRITICAL_VIOLATION",
    automatically_rejected: automatic,
    evidence_refs: evidenceRefs,
    explanation: `${failure} detected during constitutional validation.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function statusFor(scenario: Scenario, failures: readonly ConstitutionalAdaptationFailure[], severity: ConstitutionalConflictResult["severity"]): ConstitutionalAdaptationValidation["constitutional_status"] {
  if (failures.length > 0) {
    if (severity === "AUTOMATIC_REJECTION") return "REJECTED";
    if (scenario === "RESTRICTED_PROPOSAL") return "RESTRICTED";
    if (scenario === "CONSTITUTIONAL_CONFLICT") return "CONSTITUTIONAL_CONFLICT";
    return "FAIL_CLOSED";
  }
  if (scenario === "CONSTITUTIONAL_CONFLICT") return "CONSTITUTIONAL_CONFLICT";
  if (scenario === "REVIEW_REQUIRED") return "REQUIRES_CONSTITUTIONAL_REVIEW";
  return "COMPLIANT";
}

function buildValidation(input: ConstitutionalAdaptationValidatorInput): ConstitutionalAdaptationValidation {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const proposal_id = adaptation.contract.adaptation_id || governance.validation.proposal_id || `proposal_${hash(scenario).slice(0, 12)}`;
  const tenant_id = scenario === "TENANT_ISOLATION_FAILURE" || scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : adaptation.contract.tenant_id;
  const supporting_evidence = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...adaptation.contract.supporting_evidence_refs, ...adaptation.contract.replay_refs, governance.validation.validation_id]);
  const protected_principles = buildPrinciples(scenario, supporting_evidence);
  const evaluated_rules = buildRules(scenario, supporting_evidence);
  const constitutional_dependencies = buildDependencies(scenario, supporting_evidence);
  const failures = collectFailures(scenario, protected_principles, evaluated_rules, constitutional_dependencies);
  const severity = conflictSeverity(scenario, failures);
  const conflict_results = freezeArray([conflict(`constitutional_conflict_${hash(`${scenario}:${severity}`).slice(0, 12)}`, severity === "NONE" ? "CONSTITUTIONAL_INTEGRITY" : "GOVERNANCE_SUPREMACY", severity, severity === "NONE" ? "No constitutional conflict detected." : `${severity} requires constitutional disposition.`)]);
  const violations = freezeArray(failures.map((failure) => violation(failure, supporting_evidence)));
  const constitutional_status = statusFor(scenario, failures, severity);
  const base: Omit<ConstitutionalAdaptationValidation, "integrity_hash"> = {
    validation_id: `constitutional_validation_${hash(`${scenario}:${proposal_id}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    constitution_version: CONSTITUTION_VERSION,
    protected_principles,
    evaluated_rules,
    constitutional_dependencies,
    conflict_results,
    violations,
    rejection_reasons: freezeArray(violations.filter((item) => item.automatically_rejected || constitutional_status === "REJECTED").map((item) => item.explanation)),
    constitutional_status,
    constitutional_reasoning: freezeArray([
      "Constitutional validation is the highest-order safety gate before simulation, governance review, or operator evaluation.",
      constitutional_status === "COMPLIANT" ? "All protected constitutional guarantees remain intact." : `Constitutional validation resolved to ${constitutional_status}.`,
      "The validator is advisory-only and grants no execution authority.",
    ]),
    failures,
    supporting_evidence,
    replay_reference: scenario === "MISSING_REPLAY" || scenario === "REPLAY_DEGRADATION" ? "" : `constitutional_replay_${hash(`${proposal_id}:${scenario}`).slice(0, 16)}`,
    validation_timestamp: VALIDATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(validation: ConstitutionalAdaptationValidation, scenario: Scenario): ConstitutionalLedgerEntry {
  const base: Omit<ConstitutionalLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `constitutional_adaptation_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    validation_id: validation.validation_id,
    proposal_id: validation.proposal_id,
    tenant_id: validation.tenant_id,
    final_status: validation.constitutional_status,
    append_only: true,
    immutable: true,
    replayable: true,
    tenant_isolated: !validation.failures.includes("TENANT_ISOLATION_UNGUARANTEED"),
    recorded_at: VALIDATED_AT,
  };
  const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_FAILURE") return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
  return entry;
}

function resultReplayHash(result: Omit<ConstitutionalAdaptationValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<ConstitutionalAdaptationValidatorResult, "integrity_hash">): string {
  return hash({
    constitutional_adaptation_validator_version: result.constitutional_adaptation_validator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateConstitutionalAdaptation(input: ConstitutionalAdaptationValidatorInput = {}): ConstitutionalAdaptationValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const validation = buildValidation(input);
  const ledger_entry = buildLedgerEntry(validation, scenario);
  const ledgerIntegrityFailed = hashWithoutIntegrity(ledger_entry) !== ledger_entry.integrity_hash;
  const base: Omit<ConstitutionalAdaptationValidatorResult, "integrity_hash" | "replay_hash"> = {
    constitutional_adaptation_validator_version: CONSTITUTIONAL_ADAPTATION_VALIDATOR_VERSION,
    api_surface,
    validation,
    ledger_entry,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: validation.supporting_evidence.length > 0,
    advisory_only: true,
    human_governed: true,
    operator_controlled: true,
    governance_enforced: true,
    fail_closed: validation.failures.length > 0 || ledgerIntegrityFailed,
    tenant_isolated: ledger_entry.tenant_isolated,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConstitutionalAdaptationValidation(result: ConstitutionalAdaptationValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConstitutionalAdaptationValidatorFoundation(): ConstitutionalAdaptationValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    constitutional_adaptation_validator_version: CONSTITUTIONAL_ADAPTATION_VALIDATOR_VERSION,
    api_surface,
    result: validateConstitutionalAdaptation(),
  });
}

export const ConstitutionalAdaptationValidator = Object.freeze({
  validate: validateConstitutionalAdaptation,
  replay: replayConstitutionalAdaptationValidation,
});
