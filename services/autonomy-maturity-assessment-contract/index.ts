import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AutonomyMaturityAssessmentRecord,
  AutonomyMaturityAssessmentSchema,
  AutonomyMaturityContractBundle,
  AutonomyMaturityContractInput,
  AutonomyMaturityContractObservabilitySurface,
  AutonomyMaturityContractRepository,
  AutonomyMaturityContractValidationResult,
  AutonomyMaturityDomain,
  AutonomyMaturityDomainDefinition,
  AutonomyMaturityFailure,
  AutonomyMaturityLevel,
  AutonomyMaturityLevelDefinition,
  AutonomyMaturityLifecycleState,
  AutonomyMaturityLifecycleTransition,
  AutonomyMaturityRuleSet,
  AutonomyMaturityScenario,
  AutonomyMaturityScoringRule,
} from "@/types/autonomy-maturity-assessment-contract";

const VERSION = "autonomy-maturity-assessment-contract/v8ALT.11.1" as const;
const domains = Object.freeze(["CONSTITUTIONAL_COMPLIANCE", "GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT", "PLANNING_INTELLIGENCE", "EXECUTION_INTELLIGENCE", "REPLAY_INTEGRITY", "EXPLAINABILITY", "RESILIENCE", "VISIBILITY", "CERTIFICATION_READINESS"] as const);
const levels = Object.freeze(["LEVEL_1_ASSISTED_EXECUTION", "LEVEL_2_GUIDED_AUTONOMY", "LEVEL_3_CONTROLLED_AUTONOMY", "LEVEL_4_RESILIENT_AUTONOMY", "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY"] as const);
const lifecycleStates = Object.freeze(["DEFINED", "CONFIGURED", "VALIDATING", "ASSESSING", "SCORING", "REVIEWING", "CERTIFIED", "ARCHIVED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: AutonomyMaturityScenario): AutonomyMaturityFailure | null {
  const map: Partial<Record<AutonomyMaturityScenario, AutonomyMaturityFailure>> = {
    INVALID_SCHEMA: "ASSESSMENT_SCHEMA_INVALID",
    UNDEFINED_MATURITY_LEVEL: "MATURITY_LEVEL_UNDEFINED",
    INCONSISTENT_SCORING_RULES: "SCORING_RULES_INCONSISTENT",
    MISSING_GOVERNANCE_RULES: "GOVERNANCE_RULES_MISSING",
    MISSING_CONSTITUTIONAL_RULES: "CONSTITUTIONAL_RULES_MISSING",
    INCOMPLETE_LIFECYCLE: "LIFECYCLE_INCOMPLETE",
    ABSENT_REPLAY_REFERENCES: "REPLAY_REFERENCES_ABSENT",
    MISSING_INTEGRITY_HASH: "INTEGRITY_HASH_MISSING",
    DETERMINISTIC_ORDERING_VIOLATION: "DETERMINISTIC_ORDERING_VIOLATED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    HIDDEN_SCORING_LOGIC: "HIDDEN_SCORING_LOGIC_DETECTED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_VIOLATED",
  };
  return map[scenario] ?? null;
}

function domainDefinition(domain: AutonomyMaturityDomain, scenario: AutonomyMaturityScenario): AutonomyMaturityDomainDefinition {
  const measures: Record<AutonomyMaturityDomain, readonly string[]> = {
    CONSTITUTIONAL_COMPLIANCE: ["constitutional enforcement", "constitutional violations", "constitutional consistency"],
    GOVERNANCE_COMPLIANCE: ["governance enforcement", "policy adherence", "governance validation"],
    AUTHORITY_ENFORCEMENT: ["authority verification", "privilege boundaries", "escalation prevention"],
    PLANNING_INTELLIGENCE: ["planning quality", "planning consistency", "contingency planning"],
    EXECUTION_INTELLIGENCE: ["orchestration", "delegation", "supervision", "runtime behavior"],
    REPLAY_INTEGRITY: ["deterministic replay", "reconstruction", "historical consistency"],
    EXPLAINABILITY: ["transparency", "evidence quality", "reasoning completeness"],
    RESILIENCE: ["recovery capability", "runtime assurance", "degradation handling"],
    VISIBILITY: ["dashboards", "traceability", "operator awareness"],
    CERTIFICATION_READINESS: ["certification coverage", "remaining requirements", "production readiness"],
  };
  const base = { domain_id: id("AMA-D", "autonomy-maturity-domain", domain), domain, measures: freezeArray(measures[domain]), deterministic_evaluation_required: true as const, governance_required: true as const, constitutional_validation_required: true as const, replay_required: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-maturity-domain", base) });
}

function levelDefinition(level: AutonomyMaturityLevel, index: number, scenario: AutonomyMaturityScenario): AutonomyMaturityLevelDefinition {
  const titles = ["Assisted Execution", "Guided Autonomy", "Controlled Autonomy", "Resilient Autonomy", "Certified Constitutional Autonomy"] as const;
  const characteristics = [
    ["Operator-driven execution", "AI recommendations only", "Manual approvals", "Limited automation"],
    ["Autonomous planning", "Operator approval required", "Governed recommendations", "Controlled delegation"],
    ["Governed execution", "Runtime supervision", "Deterministic orchestration", "Continuous monitoring"],
    ["Self-monitoring", "Predictive intelligence", "Recovery recommendations", "Continuous assurance"],
    ["Constitution enforced", "Governance enforced", "Replay exact", "Explainability complete", "Production certified"],
  ] as const;
  const base = { level_id: id("AMA-L", "autonomy-maturity-level", level), level, ordinal: (index + 1) as 1 | 2 | 3 | 4 | 5, title: titles[index], characteristics: freezeArray(characteristics[index]), advancement_criteria: freezeArray(["governance validated", "constitutional validation passed", "replay evidence present", "operator authority preserved"]) };
  return Object.freeze({ ...base, integrity_hash: scenario === "UNDEFINED_MATURITY_LEVEL" && index === 4 ? "" : hashValue("autonomy-maturity-level", base) });
}

function scoring(scenario: AutonomyMaturityScenario): readonly AutonomyMaturityScoringRule[] {
  const rows = [["INITIAL", 0, 20], ["EMERGING", 21, 40], ["DEVELOPING", 41, 60], ["MATURE", 61, 80], ["CERTIFIED", 81, scenario === "INCONSISTENT_SCORING_RULES" ? 90 : 100]] as const;
  return freezeArray(rows.map(([category, min_score, max_score]) => Object.freeze({ category, min_score, max_score, deterministic: true, evidence_based: true, replayable: true, governance_validated: true, constitutional_validated: true })));
}

function lifecycle(scenario: AutonomyMaturityScenario): readonly AutonomyMaturityLifecycleTransition[] {
  const states = scenario === "INCOMPLETE_LIFECYCLE" ? lifecycleStates.slice(0, -1) : lifecycleStates;
  return freezeArray(states.slice(0, -1).map((from, index) => {
    const to = states[index + 1] as AutonomyMaturityLifecycleState;
    const base = { from, to, transition_order: scenario === "DETERMINISTIC_ORDERING_VIOLATION" && index === 1 ? 99 : index + 1, replay_reference: scenario === "ABSENT_REPLAY_REFERENCES" ? "" : `replay:maturity-lifecycle:${index + 1}`, lineage_reference: `lineage:maturity-lifecycle:${index + 1}`, immutable_after_certification: to === "CERTIFIED" || from === "CERTIFIED" };
    return Object.freeze({ ...base, integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-maturity-lifecycle", base) });
  }));
}

function schema(scenario: AutonomyMaturityScenario): AutonomyMaturityAssessmentSchema {
  const required = ["assessment_id", "assessment_version", "tenant_id", "mission_id", "assessment_scope", "assessment_type", "maturity_level", "maturity_score", "readiness_score", "assessment_state", "governance_status", "constitutional_status", "replay_reference", "lineage_reference", "integrity_hash"];
  const base = { schema_id: id("AMA-S", "autonomy-maturity-schema", scenario), sections: freezeArray(scenario === "INVALID_SCHEMA" ? ["ASSESSMENT_METADATA" as const] : ["ASSESSMENT_METADATA", "ASSESSMENT_CONFIGURATION", "DOMAIN_RESULTS", "OVERALL_RESULTS", "EVIDENCE"] as const), required_fields: freezeArray(scenario === "INVALID_SCHEMA" ? required.slice(0, 4) : required), supported_scopes: freezeArray(["PLATFORM", "MISSION", "CAPABILITY", "SERVICE", "AGENT", "RUNTIME", "RECOVERY", "GOVERNANCE", "CONSTITUTIONAL", "CERTIFICATION"] as const), supported_assessment_types: freezeArray(["INITIAL", "SCHEDULED", "CERTIFICATION", "CONTINUOUS"] as const) };
  return Object.freeze({ ...base, integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-maturity-schema", base) });
}

function ruleSet(scenario: AutonomyMaturityScenario): AutonomyMaturityRuleSet {
  const base = { governance_rules: freezeArray(scenario === "MISSING_GOVERNANCE_RULES" ? [] : ["validate governance first", "preserve governance supremacy", "enforce operator approval", "record governance evidence", "support governance replay"]), constitutional_rules: freezeArray(scenario === "MISSING_CONSTITUTIONAL_RULES" ? [] : ["enforce constitutional boundaries", "verify constitutional compliance", "reject constitutional violations", "preserve constitutional lineage", "support constitutional replay"]), deterministic_requirements: freezeArray(scenario === "HIDDEN_SCORING_LOGIC" ? ["hidden scoring logic"] : ["identical inputs produce identical outputs", "deterministic ordering", "immutable evidence", "replay reconstruction", "integrity hashes"]), security_requirements: freezeArray(["tenant isolation", "immutable identifiers", "append-only history", "evidence integrity", "role-based authorization", "replay protection"]), audit_requirements: freezeArray(["assessment identifier", "evaluator version", "scoring version", "evidence references", "governance references", "constitutional references", "replay identifier", "lineage identifier", "integrity verification"]) };
  return Object.freeze({ ...base, integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-maturity-rules", base) });
}

function assessmentRecord(scenario: AutonomyMaturityScenario): AutonomyMaturityAssessmentRecord {
  const base = { assessment_id: id("AMA", "autonomy-maturity-assessment", scenario), assessment_version: VERSION, tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant:foreign" : "tenant:alpha", mission_id: "mission:autonomy-maturity-contract", assessment_scope: "PLATFORM" as const, assessment_type: "INITIAL" as const, maturity_level: "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY" as const, maturity_score: 100, readiness_score: 100, assessment_state: "DEFINED" as const, evaluation_timestamp: "1970-01-01T00:00:00.000Z" as const, evaluator: "autonomy-maturity-assessment-contract" as const, governance_status: scenario === "MISSING_GOVERNANCE_RULES" ? "FAIL" as const : "PASS" as const, constitutional_status: scenario === "MISSING_CONSTITUTIONAL_RULES" ? "FAIL" as const : "PASS" as const, replay_reference: scenario === "ABSENT_REPLAY_REFERENCES" ? "" : "replay:autonomy-maturity-contract", lineage_reference: "lineage:autonomy-maturity-contract", advisory_only: true as const, maturity_advancement_authorized: false as const, production_certification_authorized: false as const, authority_change_authorized: false as const, execution_behavior_change_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-maturity-assessment-record", base) });
}

function collectFailures(repository: Omit<AutonomyMaturityContractRepository, "integrity_hash"> | AutonomyMaturityContractRepository): readonly AutonomyMaturityFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.schema.sections.length < 5 || repository.schema.required_fields.length < 10 ? ["ASSESSMENT_SCHEMA_INVALID" as const] : []),
    ...(repository.levels.length !== 5 || repository.levels.some((level) => !level.integrity_hash) ? ["MATURITY_LEVEL_UNDEFINED" as const] : []),
    ...(repository.scoring.at(-1)?.max_score !== 100 ? ["SCORING_RULES_INCONSISTENT" as const] : []),
    ...(repository.rules.governance_rules.length === 0 || repository.contract.governance_status === "FAIL" ? ["GOVERNANCE_RULES_MISSING" as const] : []),
    ...(repository.rules.constitutional_rules.length === 0 || repository.contract.constitutional_status === "FAIL" ? ["CONSTITUTIONAL_RULES_MISSING" as const] : []),
    ...(repository.lifecycle.length !== 7 ? ["LIFECYCLE_INCOMPLETE" as const] : []),
    ...(!repository.contract.replay_reference || repository.lifecycle.some((transition) => !transition.replay_reference) ? ["REPLAY_REFERENCES_ABSENT" as const] : []),
    ...(!repository.contract.integrity_hash || !repository.schema.integrity_hash || repository.domains.some((domain) => !domain.integrity_hash) || repository.lifecycle.some((transition) => !transition.integrity_hash) ? ["INTEGRITY_HASH_MISSING" as const] : []),
    ...(repository.lifecycle.some((transition, index) => transition.transition_order !== index + 1) ? ["DETERMINISTIC_ORDERING_VIOLATED" as const] : []),
    ...(repository.contract.tenant_id !== "tenant:alpha" ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(repository.rules.deterministic_requirements.includes("hidden scoring logic") ? ["HIDDEN_SCORING_LOGIC_DETECTED" as const] : []),
    ...(!repository.advisory_only || repository.maturity_advancement_authorized || repository.production_certification_authorized ? ["ADVISORY_ONLY_BEHAVIOR_VIOLATED" as const] : []),
  ]);
}

export function buildAutonomyMaturityAssessmentContract(input: AutonomyMaturityContractInput = {}): AutonomyMaturityContractRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("AMA", "autonomy-maturity-contract-repository", scenario), final_state: "AUTONOMY_MATURITY_CONTRACT_READY" as const, contract: assessmentRecord(scenario), schema: schema(scenario), domains: freezeArray(domains.map((domain) => domainDefinition(domain, scenario))), levels: freezeArray(levels.map((level, index) => levelDefinition(level, index, scenario))), scoring: scoring(scenario), lifecycle: lifecycle(scenario), rules: ruleSet(scenario), failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, maturity_advancement_authorized: false as const, production_certification_authorized: false as const, authority_change_authorized: false as const, execution_behavior_change_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "AUTONOMY_MATURITY_CONTRACT_INVALID" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("autonomy-maturity-contract-repository", repository) });
}

export function listAutonomyMaturityDomains(input: AutonomyMaturityContractInput = {}) { return buildAutonomyMaturityAssessmentContract(input).domains; }
export function listAutonomyMaturityLevels(input: AutonomyMaturityContractInput = {}) { return buildAutonomyMaturityAssessmentContract(input).levels; }
export function getAutonomyMaturityAssessmentSchema(input: AutonomyMaturityContractInput = {}) { return buildAutonomyMaturityAssessmentContract(input).schema; }
export function listAutonomyMaturityLifecycle(input: AutonomyMaturityContractInput = {}) { return buildAutonomyMaturityAssessmentContract(input).lifecycle; }

export function validateAutonomyMaturityAssessmentContract(repository = buildAutonomyMaturityAssessmentContract()): AutonomyMaturityContractValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_HASH_MISSING" as const] : [])]);
  const has = (failure: AutonomyMaturityFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "AUTONOMY_MATURITY_CONTRACT_READY";
  const result = { repository_id: repository.repository_id, valid, schema_valid: !has("ASSESSMENT_SCHEMA_INVALID"), maturity_level_defined: !has("MATURITY_LEVEL_UNDEFINED"), scoring_consistent: !has("SCORING_RULES_INCONSISTENT"), governance_rules_present: !has("GOVERNANCE_RULES_MISSING"), constitutional_rules_present: !has("CONSTITUTIONAL_RULES_MISSING"), lifecycle_complete: !has("LIFECYCLE_INCOMPLETE"), replay_references_present: !has("REPLAY_REFERENCES_ABSENT"), integrity_verified: !has("INTEGRITY_HASH_MISSING"), deterministic_ordering: !has("DETERMINISTIC_ORDERING_VIOLATED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), no_hidden_scoring_logic: !has("HIDDEN_SCORING_LOGIC_DETECTED"), advisory_only: true as const, no_maturity_advancement_authority: !repository.maturity_advancement_authorized && !repository.production_certification_authorized && !repository.authority_change_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("autonomy-maturity-contract-validation", result) });
}

export function buildAutonomyMaturityContractObservabilitySurface(repository = buildAutonomyMaturityAssessmentContract()): AutonomyMaturityContractObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, domain_count: repository.domains.length, level_count: repository.levels.length, scoring_rule_count: repository.scoring.length, lifecycle_transition_count: repository.lifecycle.length, failure_count: repository.failures.length, advisory_only: true, maturity_advancement_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getAutonomyMaturityAssessmentContractBundle(): AutonomyMaturityContractBundle {
  const repository = buildAutonomyMaturityAssessmentContract();
  return Object.freeze({ doctrine: Object.freeze({ contract_version: VERSION, final_state: "AUTONOMY_MATURITY_CONTRACT_SPECIFIED", domains, levels, principles: freezeArray(["canonical-contract", "deterministic-evaluation", "governance-first", "constitutional-validation-required", "replay-compatible", "tenant-isolated", "advisory-only", "no-maturity-advancement-authority"]) }), repository, validation: validateAutonomyMaturityAssessmentContract(repository), observability: buildAutonomyMaturityContractObservabilitySurface(repository) });
}
