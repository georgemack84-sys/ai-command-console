import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  classifyDetectedConflicts,
  computeConflictClassificationIntegrityHash,
} from "@/services/decision-conflict-classification-engine";
import type {
  ArbitrationFailureReason,
  ArbitrationLedgerRecord,
  ArbitrationObservability,
  ArbitrationOutcome,
  ArbitrationPriorityLevel,
  ArbitrationReplay,
  ArbitrationResult,
  ArbitrationRule,
  ArbitrationRulesEngineFoundation,
  ArbitrationRulesEngineInput,
  ArbitrationRulesEngineResult,
  ArbitrationValidation,
} from "@/types/decision-arbitration-rules-engine";
import type {
  ConflictClassificationEngineResult,
  ConflictClassificationRecord,
  ConflictClassificationReport,
} from "@/types/decision-conflict-classification-engine";

const NOW = "2026-07-03T23:34:00.000Z";
const ENGINE_VERSION = "arbitration-rules-engine/v1" as const;
const AUTHORIZED_COMPONENT = "decision-arbitration-rules-engine";

export const ARBITRATION_PRIORITY_HIERARCHY: readonly ArbitrationPriorityLevel[] = Object.freeze([
  "Constitution",
  "Governance",
  "Authority",
  "Safety",
  "Mission Success",
  "Forecast",
  "Optimization",
]);

export const SUPPORTED_ARBITRATION_OUTCOMES: readonly ArbitrationOutcome[] = Object.freeze([
  "RESOLVED",
  "ESCALATE_TO_OPERATOR",
  "ESCALATE_TO_GOVERNANCE",
  "DEFER",
  "REJECT",
  "SPLIT_DECISION",
  "REQUIRE_SIMULATION",
  "REQUIRE_CERTIFICATION",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

export function createArbitrationRules(): readonly ArbitrationRule[] {
  return Object.freeze(ARBITRATION_PRIORITY_HIERARCHY.map((priority_level, index) => {
    const rule_id = `arbitration_${priority_level.toLowerCase().replaceAll(" ", "_")}_rule`;
    const base: Omit<ArbitrationRule, "integrity_hash"> = {
      rule_id,
      rule_name: `${priority_level} arbitration rule`,
      rule_version: "arbitration-rule/v1",
      priority_level,
      evaluation_order: index + 1,
      prerequisites: Object.freeze(index === 0 ? ["classified_conflict"] : [`${ARBITRATION_PRIORITY_HIERARCHY[index - 1]} evaluated`]),
      evaluation_logic: `Evaluate ${priority_level} constraints deterministically before lower-priority arbitration rules.`,
      outcome_mapping: Object.freeze(outcomesForPriority(priority_level)),
      governance_refs: Object.freeze(["governance_arbitration_policy_v1"]),
      constitutional_refs: Object.freeze(["constitutional_operator_supremacy", "constitutional_advisory_only"]),
      replay_requirements: Object.freeze(["arbitration_priority_replay", "arbitration_rule_order_replay"]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function outcomesForPriority(priority: ArbitrationPriorityLevel): readonly ArbitrationOutcome[] {
  if (priority === "Constitution") return ["REJECT"];
  if (priority === "Governance") return ["RESOLVED", "ESCALATE_TO_GOVERNANCE", "REJECT"];
  if (priority === "Authority") return ["RESOLVED", "ESCALATE_TO_OPERATOR"];
  if (priority === "Safety") return ["RESOLVED", "DEFER"];
  if (priority === "Mission Success") return ["RESOLVED", "SPLIT_DECISION", "ESCALATE_TO_OPERATOR"];
  if (priority === "Forecast") return ["RESOLVED", "REQUIRE_SIMULATION", "DEFER"];
  return ["RESOLVED"];
}

function rulesValid(rules: readonly ArbitrationRule[]): boolean {
  if (rules.length !== ARBITRATION_PRIORITY_HIERARCHY.length) return false;
  return rules.every((rule, index) => (
    rule.priority_level === ARBITRATION_PRIORITY_HIERARCHY[index]
    && rule.evaluation_order === index + 1
    && rule.integrity_hash === hashWithoutIntegrity(rule)
  ));
}

function reportsByClassification(reports: readonly ConflictClassificationReport[]): Map<string, ConflictClassificationReport> {
  return new Map(reports.map((report) => [report.classification_id, report]));
}

function pathUntil(priority: ArbitrationPriorityLevel): readonly ArbitrationPriorityLevel[] {
  return Object.freeze(ARBITRATION_PRIORITY_HIERARCHY.slice(0, ARBITRATION_PRIORITY_HIERARCHY.indexOf(priority) + 1));
}

function ruleIdsForPath(path: readonly ArbitrationPriorityLevel[], rules: readonly ArbitrationRule[]): readonly string[] {
  return Object.freeze(path.map((priority) => rules.find((rule) => rule.priority_level === priority)?.rule_id ?? `missing_${priority}`));
}

function selectedCandidates(candidates: readonly string[], outcome: ArbitrationOutcome): readonly string[] {
  if (outcome === "RESOLVED" || outcome === "SPLIT_DECISION") return Object.freeze([...candidates].sort());
  return Object.freeze([]);
}

function rejectedCandidates(candidates: readonly string[], outcome: ArbitrationOutcome): readonly string[] {
  if (outcome === "REJECT") return Object.freeze([...candidates].sort());
  return Object.freeze([]);
}

function determineOutcome(classification: ConflictClassificationRecord): Readonly<{
  outcome: ArbitrationOutcome;
  priority: ArbitrationPriorityLevel;
  tradeoff: readonly string[];
}> {
  const secondary = classification.secondary_categories;
  if (classification.constitutional_impact === "BLOCKING" || classification.primary_category === "Constitutional") {
    return { outcome: "REJECT", priority: "Constitution", tradeoff: Object.freeze(["constitutional_supremacy_terminates_arbitration"]) };
  }
  if (classification.primary_category === "Tenant Boundary") {
    return { outcome: "REJECT", priority: "Constitution", tradeoff: Object.freeze(["tenant_isolation_breach_rejected"]) };
  }
  if (classification.primary_category === "Governance" || classification.governance_impact === "CRITICAL") {
    return { outcome: "ESCALATE_TO_GOVERNANCE", priority: "Governance", tradeoff: Object.freeze(["governance_supremacy_overrides_lower_priority_rules"]) };
  }
  if (classification.primary_category === "Authority" || secondary.includes("Authority") || classification.operator_visibility === "REQUIRED") {
    return { outcome: "ESCALATE_TO_OPERATOR", priority: "Authority", tradeoff: Object.freeze(["operator_authority_required_for_ambiguous_or_overlapping_authority"]) };
  }
  if (classification.severity === "BLOCKING" || classification.primary_category === "Certification" || secondary.includes("Certification")) {
    return { outcome: "REQUIRE_CERTIFICATION", priority: "Safety", tradeoff: Object.freeze(["certification_required_before_advancement"]) };
  }
  if (classification.primary_category === "Risk" || classification.severity === "CRITICAL") {
    return { outcome: "DEFER", priority: "Safety", tradeoff: Object.freeze(["risk_weighting_prevents_deterministic_resolution"]) };
  }
  if (classification.primary_category === "Mission Objective") {
    return { outcome: "SPLIT_DECISION", priority: "Mission Success", tradeoff: Object.freeze(["competing_mission_objectives_preserved_for_operator_review"]) };
  }
  if (classification.primary_category === "Forecast" || secondary.includes("Forecast") || secondary.includes("Confidence")) {
    return { outcome: "REQUIRE_SIMULATION", priority: "Forecast", tradeoff: Object.freeze(["forecast_or_confidence_uncertainty_requires_simulation"]) };
  }
  return { outcome: "RESOLVED", priority: "Optimization", tradeoff: Object.freeze(["all_higher_priority_constraints_satisfied"]) };
}

export function arbitrateClassification(
  classification: ConflictClassificationRecord,
  report: ConflictClassificationReport | undefined,
  rules: readonly ArbitrationRule[] = createArbitrationRules(),
): ArbitrationResult {
  const decision = determineOutcome(classification);
  const path = pathUntil(decision.priority);
  const candidates = report?.originating_decisions ?? [classification.conflict_id];
  const outcome = decision.outcome;
  const base: Omit<ArbitrationResult, "integrity_hash"> = {
    arbitration_id: `arbitration_${classification.classification_id}`,
    conflict_id: classification.conflict_id,
    classification_id: classification.classification_id,
    evaluated_candidates: Object.freeze(normalizeStrings(candidates)),
    rules_applied: ruleIdsForPath(path, rules),
    resolution_priority_path: path,
    arbitration_outcome: outcome,
    selected_candidate_refs: selectedCandidates(candidates, outcome),
    rejected_candidate_refs: rejectedCandidates(candidates, outcome),
    escalation_required: outcome === "ESCALATE_TO_OPERATOR" || outcome === "ESCALATE_TO_GOVERNANCE" || outcome === "REQUIRE_SIMULATION" || outcome === "REQUIRE_CERTIFICATION" || outcome === "DEFER",
    governance_summary: classification.governance_impact === "NONE" ? "Governance evaluated with no blocking impact." : `Governance impact ${classification.governance_impact} controls lower-priority optimization.`,
    constitutional_summary: classification.constitutional_impact === "BLOCKING" ? "Constitutional violation rejected before lower-priority rules." : "Constitutional advisory-only, operator supremacy, and governance supremacy checks passed.",
    operator_summary: outcome === "ESCALATE_TO_OPERATOR" ? "Operator authority required before proceeding." : "No autonomous execution authorized; outcome remains advisory.",
    tradeoff_metadata: decision.tradeoff,
    advisory_only: true,
    replay_ref: `${classification.replay_ref}_arbitration`,
    lineage_ref: `${classification.lineage_ref}_arbitration`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function computeArbitrationIntegrityHash(arbitration: Omit<ArbitrationResult, "integrity_hash"> | ArbitrationResult): string {
  return hashWithoutIntegrity(arbitration);
}

function validationResult(failures: readonly ArbitrationFailureReason[]): ArbitrationValidation {
  const unique = Object.freeze([...new Set(failures)] as ArbitrationFailureReason[]);
  const has = (failure: ArbitrationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      rules_present: !has("MISSING_ARBITRATION_RULES"),
      priority_order_valid: !has("INVALID_PRIORITY_ORDERING"),
      governance_valid: !has("MISSING_GOVERNANCE_REFERENCES"),
      constitutional_valid: !has("MISSING_CONSTITUTIONAL_METADATA"),
      outcome_supported: !has("UNSUPPORTED_ARBITRATION_OUTCOME"),
      escalation_valid: !has("INVALID_ESCALATION_PATH"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function validateArbitration(
  classification: ConflictClassificationRecord,
  arbitration: unknown,
  rules: readonly ArbitrationRule[] = createArbitrationRules(),
): ArbitrationValidation {
  if (!arbitration || typeof arbitration !== "object" || Array.isArray(arbitration)) return validationResult(["UNSUPPORTED_ARBITRATION_OUTCOME"]);
  const typed = arbitration as ArbitrationResult;
  const failures: ArbitrationFailureReason[] = [];
  if (rules.length === 0) failures.push("MISSING_ARBITRATION_RULES");
  if (!rulesValid(rules)) failures.push("INVALID_PRIORITY_ORDERING");
  if (classification.governance_impact !== "NONE" && !typed.governance_summary) failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (!typed.constitutional_summary) failures.push("MISSING_CONSTITUTIONAL_METADATA");
  if (!typed.replay_ref) failures.push("REPLAY_CORRUPTION");
  if (!SUPPORTED_ARBITRATION_OUTCOMES.includes(typed.arbitration_outcome)) failures.push("UNSUPPORTED_ARBITRATION_OUTCOME");
  if ((typed.arbitration_outcome === "ESCALATE_TO_OPERATOR" || typed.arbitration_outcome === "ESCALATE_TO_GOVERNANCE") && !typed.escalation_required) failures.push("INVALID_ESCALATION_PATH");
  if (typed.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && computeArbitrationIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeConflictClassificationIntegrityHash(classification) !== classification.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(failures);
}

function ledgerHash(record: Omit<ArbitrationLedgerRecord, "integrity_hash"> | ArbitrationLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeArbitrationLedger(arbitration: ArbitrationResult): ArbitrationLedgerRecord {
  const base: Omit<ArbitrationLedgerRecord, "integrity_hash"> = {
    ledger_id: `arbitration_ledger_${arbitration.arbitration_id}`,
    arbitration_id: arbitration.arbitration_id,
    conflict_id: arbitration.conflict_id,
    classification_id: arbitration.classification_id,
    arbitration_outcome: arbitration.arbitration_outcome,
    rules_applied: arbitration.rules_applied,
    replay_ref: arbitration.replay_ref,
    lineage_ref: arbitration.lineage_ref,
    arbitration_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function replayHash(result: Omit<ArbitrationRulesEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    rules: result.rules,
    arbitrations: result.arbitrations,
    validations: result.validations,
    ledger_records: result.ledger_records,
    failures: result.failures,
  });
}

function failResult(failures: readonly ArbitrationFailureReason[], rules: readonly ArbitrationRule[] = []): ArbitrationRulesEngineResult {
  const base: Omit<ArbitrationRulesEngineResult, "integrity_hash" | "replay_hash"> = {
    arbitration_status: "FAIL",
    fail_closed: true,
    rules: Object.freeze([...rules]),
    arbitrations: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function classificationResultFromInput(input: ArbitrationRulesEngineInput): ConflictClassificationEngineResult {
  if (input.classification_result) return input.classification_result;
  if (input.classifications) {
    return {
      classification_status: "PASS",
      fail_closed: false,
      classifications: input.classifications,
      reports: input.reports ?? [],
      validations: [],
      ledger_records: [],
      replay_hash: "input_classifications_replay_ref",
      failures: [],
      deterministic: true,
      advisory_only: true,
      integrity_hash: "input_classifications_integrity_ref",
    };
  }
  return classifyDetectedConflicts();
}

export function arbitrateClassifiedConflicts(input: ArbitrationRulesEngineInput = {}): ArbitrationRulesEngineResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_RULE_EXECUTION"]);
  const rules = Object.freeze([...(input.rules ?? createArbitrationRules())]);
  if (rules.length === 0) return failResult(["MISSING_ARBITRATION_RULES"], rules);
  if (!rulesValid(rules)) return failResult(["INVALID_PRIORITY_ORDERING"], rules);
  const classificationResult = classificationResultFromInput(input);
  if (classificationResult.classifications.length === 0) return failResult(["NO_CLASSIFICATIONS"], rules);
  const reports = reportsByClassification(input.reports ?? classificationResult.reports);
  const arbitrations = Object.freeze(classificationResult.classifications.map((classification) => arbitrateClassification(classification, reports.get(classification.classification_id), rules)));
  const validations = Object.freeze(arbitrations.map((arbitration) => {
    const classification = classificationResult.classifications.find((item) => item.classification_id === arbitration.classification_id)!;
    return validateArbitration(classification, arbitration, rules);
  }));
  if (validations.some((validation) => validation.validation_state !== "VALID")) return failResult(validations.flatMap((validation) => validation.failures), rules);
  const ledger_records = Object.freeze(arbitrations.map(writeArbitrationLedger));
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) return failResult(["ARBITRATION_LEDGER_FAILED"], rules);
  const base: Omit<ArbitrationRulesEngineResult, "integrity_hash" | "replay_hash"> = {
    arbitration_status: "PASS",
    fail_closed: false,
    rules,
    arbitrations,
    validations,
    ledger_records,
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"], rules);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayArbitrationRulesEngine(result: ArbitrationRulesEngineResult): ArbitrationReplay {
  const reconstructed = replayHash(result);
  const ledgerValid = result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const replay_valid = result.replay_hash === reconstructed && ledgerValid;
  const failures: ArbitrationFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<ArbitrationReplay, "integrity_hash"> = {
    replay_id: "replay_arbitration_rules_engine",
    replay_valid,
    arbitration_refs: Object.freeze(result.arbitrations.map((arbitration) => arbitration.arbitration_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.ledger_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function countBy<T extends string>(items: readonly T[], keys: readonly T[]): Record<T, number> {
  return Object.freeze(keys.reduce((counts, key) => {
    counts[key] = items.filter((item) => item === key).length;
    return counts;
  }, {} as Record<T, number>));
}

export function buildArbitrationObservability(result: ArbitrationRulesEngineResult): ArbitrationObservability {
  return Object.freeze({
    arbitrations_executed: result.arbitrations.length,
    outcomes_by_type: countBy(result.arbitrations.map((arbitration) => arbitration.arbitration_outcome), SUPPORTED_ARBITRATION_OUTCOMES),
    rules_executed: result.arbitrations.reduce((sum, arbitration) => sum + arbitration.rules_applied.length, 0),
    operator_escalations: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "ESCALATE_TO_OPERATOR").length,
    governance_escalations: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "ESCALATE_TO_GOVERNANCE").length,
    simulation_requests: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "REQUIRE_SIMULATION").length,
    certification_requests: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "REQUIRE_CERTIFICATION").length,
    constitutional_rejections: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "REJECT" && arbitration.resolution_priority_path.includes("Constitution")).length,
    governance_rejections: result.arbitrations.filter((arbitration) => arbitration.arbitration_outcome === "REJECT" && arbitration.resolution_priority_path.includes("Governance")).length,
    replay_success_rate: replayArbitrationRulesEngine(result).replay_valid ? 1 : 0,
    validation_failures: result.validations.filter((validation) => validation.validation_state !== "VALID").length,
    integrity_failures: result.validations.filter((validation) => !validation.checks.integrity_valid).length,
  });
}

export function getArbitrationRulesEngineFoundation(): ArbitrationRulesEngineFoundation {
  const result = arbitrateClassifiedConflicts();
  const replay = replayArbitrationRulesEngine(result);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    priority_hierarchy: ARBITRATION_PRIORITY_HIERARCHY,
    supported_outcomes: SUPPORTED_ARBITRATION_OUTCOMES,
    result,
    replay,
    observability: buildArbitrationObservability(result),
  });
}

export const ArbitrationRulesEngine = Object.freeze({
  rules: createArbitrationRules,
  arbitrateOne: arbitrateClassification,
  arbitrate: arbitrateClassifiedConflicts,
  validate: validateArbitration,
  replay: replayArbitrationRulesEngine,
});
