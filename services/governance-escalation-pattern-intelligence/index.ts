import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayPatternScoring, scorePatternIntelligence } from "@/services/pattern-confidence-strategic-scoring";
import type { PatternScoringInput, PatternScoringResult } from "@/types/pattern-confidence-strategic-scoring";
import type {
  GovernanceEscalationApiSurface,
  GovernanceEscalationFailure,
  GovernanceEscalationFoundation,
  GovernanceEscalationInput,
  GovernanceEscalationLevel,
  GovernanceEscalationResult,
  GovernanceEscalationValidation,
  GovernancePatternRecord,
  GovernancePatternRegistry,
  GovernancePatternType,
} from "@/types/governance-escalation-pattern-intelligence";

const GOVERNANCE_ESCALATION_VERSION = "governance-escalation-pattern-intelligence/v1" as const;

type Scenario = NonNullable<GovernanceEscalationInput["scenario"]>;

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

function scoringScenario(scenario: Scenario): PatternScoringInput["scenario"] {
  const map: Partial<Record<Scenario, PatternScoringInput["scenario"]>> = {
    MISSING_SCORING: "MISSING_VALIDATION",
    REJECTED_SCORING: "REJECTED_PATTERN",
    MISSING_GOVERNANCE_LINEAGE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: GovernanceEscalationInput, scenario: Scenario): PatternScoringResult {
  if (input.scoring_result) return input.scoring_result;
  return scorePatternIntelligence({ scenario: scoringScenario(scenario) });
}

function buildApiSurface(): GovernanceEscalationApiSurface {
  const base: Omit<GovernanceEscalationApiSurface, "integrity_hash"> = {
    api_id: "governance_escalation_pattern_intelligence_api",
    analyze_governance_patterns: "POST /governance-escalation-pattern-intelligence/analyze",
    retrieve_governance_findings: "POST /governance-escalation-pattern-intelligence/governance",
    retrieve_constitutional_findings: "POST /governance-escalation-pattern-intelligence/constitutional",
    retrieve_authority_findings: "POST /governance-escalation-pattern-intelligence/authority",
    retrieve_certification_findings: "POST /governance-escalation-pattern-intelligence/certification",
    retrieve_escalation_recommendations: "POST /governance-escalation-pattern-intelligence/escalation",
    retrieve_registry: "POST /governance-escalation-pattern-intelligence/registry",
    replay_governance_analysis: "POST /governance-escalation-pattern-intelligence/replay",
    retrieve_contract: "GET /governance-escalation-pattern-intelligence/contract",
    update_supported: false,
    delete_supported: false,
    enforcement_supported: false,
    authority_mutation_supported: false,
    policy_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function patternTypeFor(scenario: Scenario, score: PatternScoringResult["score_records"][number]): GovernancePatternType {
  if (scenario === "AUTHORITY_CONFLICT") return "AUTHORITY_CONFLICT";
  if (scenario === "CONSTITUTIONAL_RISK") return "CONSTITUTIONAL_RISK";
  if (scenario === "CERTIFICATION_FAILURE") return "CERTIFICATION_FAILURE_PATTERN";
  if (scenario === "APPROVAL_BOTTLENECK") return "APPROVAL_DELAY_PATTERN";
  if (scenario === "REPLAY_DIVERGENCE") return "REPLAY_FAILURE_PATTERN";
  if (scenario === "HASH_MISMATCH") return "INTEGRITY_FAILURE_PATTERN";
  if (scenario === "CROSS_TENANT") return "TENANT_BOUNDARY_RISK";
  if (score.governance_importance >= 0.8) return "GOVERNANCE_REVIEW_FAILURE";
  return "RECURRING_POLICY_VIOLATION";
}

function constitutionalRelevance(type: GovernancePatternType, scenario: Scenario): number {
  if (scenario === "CONSTITUTIONAL_RISK") return 0.97;
  if (["CONSTITUTIONAL_RISK", "ADVISORY_BOUNDARY_RISK", "REPLAY_GOVERNANCE_RISK", "TENANT_BOUNDARY_RISK"].includes(type)) return 0.92;
  return 0.62;
}

function authorityRelevance(type: GovernancePatternType, scenario: Scenario): number {
  if (scenario === "AUTHORITY_CONFLICT") return 0.96;
  if (["AUTHORITY_CONFLICT", "APPROVAL_AUTHORITY_CONFLICT", "ESCALATION_AUTHORITY_CONFLICT"].includes(type)) return 0.91;
  return 0.58;
}

function certificationRelevance(type: GovernancePatternType, scenario: Scenario): number {
  if (scenario === "CERTIFICATION_FAILURE") return 0.94;
  if (["CERTIFICATION_FAILURE_PATTERN", "VALIDATION_FAILURE_PATTERN", "REPLAY_FAILURE_PATTERN", "INTEGRITY_FAILURE_PATTERN"].includes(type)) return 0.89;
  return 0.54;
}

function severityFor(type: GovernancePatternType, score: PatternScoringResult["score_records"][number], scenario: Scenario): number {
  const constitutional = constitutionalRelevance(type, scenario);
  const authority = authorityRelevance(type, scenario);
  const certification = certificationRelevance(type, scenario);
  const governanceWeight = scenario === "APPROVAL_BOTTLENECK" ? 0.22 : 0.32;
  return clamp(
    score.governance_importance * governanceWeight +
    constitutional * 0.24 +
    authority * 0.18 +
    certification * 0.16 +
    score.risk_relevance * 0.1,
  );
}

function escalationLevelFor(type: GovernancePatternType, severity: number, scenario: Scenario): GovernanceEscalationLevel {
  if (scenario === "NONDETERMINISTIC_ESCALATION") return "LEVEL_2_REVIEW";
  if (scenario === "CONSTITUTIONAL_RISK" || type === "CONSTITUTIONAL_RISK" || type === "TENANT_BOUNDARY_RISK") return "LEVEL_4_CONSTITUTIONAL";
  if (severity >= 0.9) return "LEVEL_5_EXECUTIVE_GOVERNANCE";
  if (severity >= 0.75) return "LEVEL_3_GOVERNANCE";
  if (severity >= 0.55) return "LEVEL_2_REVIEW";
  return "LEVEL_1_INFORMATION";
}

function recommendedAction(type: GovernancePatternType, level: GovernanceEscalationLevel): string {
  const actionByType: Record<GovernancePatternType, string> = {
    RECURRING_POLICY_VIOLATION: "Governance review of recurring policy variance.",
    GOVERNANCE_REVIEW_FAILURE: "Governance review of repeated review failure.",
    GOVERNANCE_OVERRIDE_PATTERN: "Operator-visible review of recurring governance override pattern.",
    AUTHORITY_CONFLICT: "Authority registry review of recurring ownership conflict.",
    APPROVAL_AUTHORITY_CONFLICT: "Approval authority reconciliation review.",
    ESCALATION_AUTHORITY_CONFLICT: "Escalation path ownership review.",
    CONSTITUTIONAL_RISK: "Constitutional review before any governance response.",
    ADVISORY_BOUNDARY_RISK: "Advisory boundary compliance review.",
    REPLAY_GOVERNANCE_RISK: "Replay governance integrity review.",
    TENANT_BOUNDARY_RISK: "Tenant isolation governance review.",
    CERTIFICATION_FAILURE_PATTERN: "Certification gate review for recurring failures.",
    VALIDATION_FAILURE_PATTERN: "Validation evidence review.",
    REPLAY_FAILURE_PATTERN: "Replay certification review.",
    INTEGRITY_FAILURE_PATTERN: "Integrity certification review.",
    APPROVAL_DELAY_PATTERN: "Approval workflow bottleneck review.",
    GOVERNANCE_CONGESTION_PATTERN: "Governance queue load review.",
    REVIEW_BACKLOG_PATTERN: "Review backlog triage recommendation.",
    ESCALATION_QUEUE_PATTERN: "Escalation queue prioritization review.",
  };
  return `${actionByType[type]} Escalation recommendation: ${level}.`;
}

function buildAuthorityRefs(score: PatternScoringResult["score_records"][number], scenario: Scenario): readonly string[] {
  if (scenario === "MISSING_AUTHORITY_REFS") return freezeArray([]);
  return freezeArray(score.governance_refs.map((ref) => `${ref}:authority`));
}

function buildCertificationRefs(score: PatternScoringResult["score_records"][number], scenario: Scenario): readonly string[] {
  if (scenario === "MISSING_CERTIFICATION_EVIDENCE") return freezeArray([]);
  return freezeArray(score.evidence_refs.map((ref) => `${ref}:certification`));
}

function buildGovernanceRecords(scoringResult: PatternScoringResult, scenario: Scenario): readonly GovernancePatternRecord[] {
  if (scenario === "MISSING_SCORING") return freezeArray([]);
  return freezeArray(scoringResult.score_records.map((score) => {
    const type = patternTypeFor(scenario, score);
    const severity = severityFor(type, score, scenario);
    const escalation = escalationLevelFor(type, severity, scenario);
    const governanceRefs = scenario === "MISSING_GOVERNANCE_LINEAGE" ? freezeArray([]) : score.governance_refs;
    const authorityRefs = buildAuthorityRefs(score, scenario);
    const certificationRefs = buildCertificationRefs(score, scenario);
    const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : score.replay_refs;
    const explanation = scenario === "MISSING_EXPLANATION"
      ? ""
      : `Detected ${type} for ${score.pattern_id}; severity ${severity}; ${escalation} recommended from governance, constitutional, authority, certification, and replay evidence.`;
    const base: Omit<GovernancePatternRecord, "integrity_hash"> = {
      governance_pattern_id: `governance_pattern_${hash(`${score.score_id}:${type}:${escalation}`).slice(0, 16)}`,
      pattern_id: score.pattern_id,
      tenant_id: scenario === "CROSS_TENANT" ? `${score.tenant_id}:foreign` : score.tenant_id,
      mission_scope: "mission-control-pattern-intelligence",
      governance_pattern_type: type,
      governance_summary: explanation,
      constitutional_relevance: constitutionalRelevance(type, scenario),
      authority_relevance: authorityRelevance(type, scenario),
      certification_relevance: certificationRelevance(type, scenario),
      governance_severity: severity,
      escalation_level: escalation,
      escalation_rule_version: scenario === "MISSING_RULE_VERSION" ? "" as "governance-escalation-rule/v1" : "governance-escalation-rule/v1",
      supporting_pattern_refs: freezeArray([score.pattern_id, score.score_id]),
      supporting_governance_refs: governanceRefs,
      supporting_authority_refs: authorityRefs,
      supporting_certification_refs: certificationRefs,
      supporting_replay_refs: replayRefs,
      escalation_required: escalation !== "LEVEL_1_INFORMATION",
      recommended_governance_action: recommendedAction(type, escalation),
      explanation,
      replay_refs: replayRefs,
      advisory_only: true,
      automatic_enforcement: false,
      modifies_policy: false,
      modifies_authority: false,
      modifies_certification: false,
      blocks_execution: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.governance_pattern_id }) });
    if (scenario === "AUTONOMOUS_GOVERNANCE_ACTION") return Object.freeze({ ...record, automatic_enforcement: true as false });
    if (scenario === "AUTHORITY_MUTATION") return Object.freeze({ ...record, modifies_authority: true as false });
    if (scenario === "POLICY_MUTATION") return Object.freeze({ ...record, modifies_policy: true as false });
    return record;
  }));
}

function buildRegistry(scoringResult: PatternScoringResult, records: readonly GovernancePatternRecord[], scenario: Scenario): GovernancePatternRegistry {
  const escalation_index = records.reduce((index, record) => {
    return { ...index, [record.escalation_level]: freezeArray([...(index[record.escalation_level] ?? []), record.governance_pattern_id]) };
  }, {} as Record<GovernanceEscalationLevel, readonly string[]>);
  const base: Omit<GovernancePatternRegistry, "integrity_hash"> = {
    registry_id: `governance_pattern_registry_${hash(scoringResult.registry.registry_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${scoringResult.registry.tenant_id}:foreign` : scoringResult.registry.tenant_id,
    governance_pattern_refs: records.map((record) => record.governance_pattern_id),
    pattern_refs: records.map((record) => record.pattern_id),
    escalation_index: Object.freeze(escalation_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(scoringResult: PatternScoringResult, records: readonly GovernancePatternRecord[], registry: GovernancePatternRegistry, scenario: Scenario): readonly GovernanceEscalationFailure[] {
  const failures: GovernanceEscalationFailure[] = [];
  if (scenario === "MISSING_SCORING" || !records.length) failures.push("SCORED_PATTERN_MISSING");
  if (scenario === "REJECTED_SCORING" || !scoringResult.validation.certified) failures.push("SCORING_INPUT_REJECTED");
  if (scenario === "MISSING_GOVERNANCE_LINEAGE" || records.some((record) => !record.supporting_governance_refs.length)) failures.push("GOVERNANCE_LINEAGE_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL_REFS" || records.some((record) => record.constitutional_relevance <= 0)) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (scenario === "MISSING_AUTHORITY_REFS" || records.some((record) => !record.supporting_authority_refs.length)) failures.push("AUTHORITY_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_CERTIFICATION_EVIDENCE" || records.some((record) => !record.supporting_certification_refs.length)) failures.push("CERTIFICATION_EVIDENCE_UNAVAILABLE");
  if (scenario === "MISSING_REPLAY" || records.some((record) => !record.replay_refs.length || !record.supporting_replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "REPLAY_DIVERGENCE" || !replayPatternScoring(scoringResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== scoringResult.registry.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "MISSING_EXPLANATION" || records.some((record) => !record.explanation || !record.governance_summary)) failures.push("EXPLANATION_MISSING");
  if (scenario === "MISSING_RULE_VERSION" || records.some((record) => !record.escalation_rule_version)) failures.push("ESCALATION_RULE_VERSION_UNAVAILABLE");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "AUTONOMOUS_GOVERNANCE_ACTION" || records.some((record) => record.automatic_enforcement || record.blocks_execution)) failures.push("AUTONOMOUS_GOVERNANCE_ACTION_DETECTED");
  if (scenario === "AUTHORITY_MUTATION" || records.some((record) => record.modifies_authority)) failures.push("AUTHORITY_MUTATION_DETECTED");
  if (scenario === "POLICY_MUTATION" || records.some((record) => record.modifies_policy)) failures.push("POLICY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC_ESCALATION") failures.push("NONDETERMINISTIC_ESCALATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly GovernanceEscalationFailure[]): GovernanceEscalationValidation["state"] {
  if (failures.includes("CERTIFICATION_EVIDENCE_UNAVAILABLE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(records: readonly GovernancePatternRecord[], registry: GovernancePatternRegistry, failures: readonly GovernanceEscalationFailure[]): GovernanceEscalationValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<GovernanceEscalationValidation, "integrity_hash"> = {
    validation_id: "governance_escalation_pattern_intelligence_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && registryVerified,
    failures,
    scoring_input_accepted: !failures.includes("SCORED_PATTERN_MISSING") && !failures.includes("SCORING_INPUT_REJECTED"),
    governance_lineage_complete: !failures.includes("GOVERNANCE_LINEAGE_MISSING"),
    constitutional_references_complete: !failures.includes("CONSTITUTIONAL_REFERENCES_MISSING"),
    authority_references_complete: !failures.includes("AUTHORITY_REFERENCES_INCOMPLETE"),
    certification_evidence_available: !failures.includes("CERTIFICATION_EVIDENCE_UNAVAILABLE"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_INCOMPLETE") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    escalation_rules_available: !failures.includes("ESCALATION_RULE_VERSION_UNAVAILABLE"),
    deterministic_escalation: !failures.includes("NONDETERMINISTIC_ESCALATION_DETECTED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: recordsVerified && registryVerified,
    advisory_only: records.every((record) => record.advisory_only),
    no_governance_action: records.every((record) => !record.automatic_enforcement && !record.blocks_execution),
    no_authority_mutation: records.every((record) => !record.modifies_authority),
    no_policy_mutation: records.every((record) => !record.modifies_policy),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceEscalationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    scoring_replay_hash: result.scoring_result.replay_hash,
    governance_pattern_records: result.governance_pattern_records,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<GovernanceEscalationResult, "integrity_hash">): string {
  return hash({
    governance_escalation_pattern_intelligence_version: result.governance_escalation_pattern_intelligence_version,
    api_surface_hash: result.api_surface.integrity_hash,
    scoring_hash: result.scoring_result.integrity_hash,
    governance_pattern_hashes: result.governance_pattern_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    advisory_only: result.advisory_only,
    automatic_enforcement: result.automatic_enforcement,
  });
}

export function analyzeGovernanceEscalationPatterns(input: GovernanceEscalationInput = {}): GovernanceEscalationResult {
  const scenario = input.scenario ?? "BASELINE";
  const scoring_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const governance_pattern_records = buildGovernanceRecords(scoring_result, scenario);
  const registry = buildRegistry(scoring_result, governance_pattern_records, scenario);
  const failures = collectFailures(scoring_result, governance_pattern_records, registry, scenario);
  const validation = buildValidation(governance_pattern_records, registry, failures);
  const base: Omit<GovernanceEscalationResult, "integrity_hash" | "replay_hash"> = {
    governance_escalation_pattern_intelligence_version: GOVERNANCE_ESCALATION_VERSION,
    scoring_result,
    api_surface,
    governance_pattern_records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    constitutionally_compliant: true,
    governance_traceable: true,
    operator_visible: true,
    tenant_isolated: true,
    advisory_only: true,
    automatic_enforcement: false,
    modifies_policy: false,
    modifies_authority: false,
    modifies_certification: false,
    blocks_execution: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceEscalationPatterns(result: GovernanceEscalationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternScoring(result.scoring_result);
}

export function computeGovernancePatternHash(record: Omit<GovernancePatternRecord, "integrity_hash"> | GovernancePatternRecord): string {
  return hashWithoutIntegrity(record);
}

export function getGovernanceEscalationPatternFoundation(): GovernanceEscalationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_escalation_pattern_intelligence_version: GOVERNANCE_ESCALATION_VERSION,
    api_surface,
    result: analyzeGovernanceEscalationPatterns(),
  });
}

export const GovernanceEscalationPatternIntelligence = Object.freeze({
  analyze: analyzeGovernanceEscalationPatterns,
  replay: replayGovernanceEscalationPatterns,
});
