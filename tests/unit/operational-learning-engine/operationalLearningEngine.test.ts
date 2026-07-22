import { describe, expect, it } from "vitest";
import {
  getOperationalLearningEngineBundle,
  replayOperationalLearningEngine,
  runOperationalLearningEngine,
  validateOperationalLearningEngine,
} from "@/services/operational-learning-engine";
import type { LearningFailure, OperationalLearningResult } from "@/types/operational-learning-engine";

const failureScenarios: LearningFailure[] = [
  "LEARNING_NOT_DETERMINISTIC",
  "REPLAY_NOT_REPRODUCIBLE",
  "ELIGIBILITY_NOT_GOVERNED",
  "OPERATIONAL_MEMORY_MUTABLE",
  "PATTERN_QUALIFICATION_NOT_OPERATIONAL",
  "GOVERNANCE_ENFORCEMENT_NOT_VALIDATED",
  "TENANT_ISOLATION_NOT_PRESERVED",
  "AUTHORITY_BOUNDARY_NOT_ENFORCED",
  "LEARNING_LINEAGE_INCOMPLETE",
  "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE",
  "CERTIFICATION_INTEGRATION_NOT_VERIFIED",
  "OPERATIONAL_LEARNING_NOT_CERTIFIED",
  "HISTORICAL_RECORD_MODIFIED",
  "VALIDATION_STAGE_BYPASSED",
  "PHASE_18_2_MONITORING_NOT_VALID",
];

describe("operational learning engine", () => {
  it("publishes the Phase 18.3 doctrine and validates the baseline bundle", () => {
    const bundle = getOperationalLearningEngineBundle();

    expect(bundle.doctrine.version).toBe("operational-learning-engine/v18.3");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-monitoring-intelligence/v18.2");
    expect(bundle.doctrine.lifecycle_states).toEqual([
      "IDENTIFIED",
      "ELIGIBILITY_VALIDATED",
      "GOVERNANCE_VALIDATED",
      "LEARNING_IN_PROGRESS",
      "PATTERN_QUALIFIED",
      "MEMORY_COMMITTED",
      "ACTIVE",
      "SUPERSEDED",
      "ARCHIVED",
    ]);
    expect(bundle.doctrine.learning_sources).toHaveLength(12);
    expect(bundle.doctrine.pattern_types).toHaveLength(10);
    expect(bundle.doctrine.decision_outcomes).toEqual([
      "APPROVED",
      "REJECTED",
      "REQUIRES_MORE_EVIDENCE",
      "REQUIRES_GOVERNANCE_REVIEW",
      "REQUIRES_CERTIFICATION",
      "DEFERRED",
    ]);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps learning deterministic, replay-preserving, and advisory-only", () => {
    const result = runOperationalLearningEngine();

    expect(result.learning_engine.deterministic_execution).toBe(true);
    expect(result.learning_engine.replay_preservation).toBe(true);
    expect(result.learning_engine.advisory_only).toBe(true);
    expect(result.learning_engine.stages_ordered).toBe(true);
    expect(result.decision_engine.candidate_outcome).toBe("APPROVED");
    expect(result.decision_engine.deterministic_evaluation).toBe(true);
  });

  it("enforces eligibility, governance, tenant isolation, and authority boundaries", () => {
    const result = runOperationalLearningEngine();

    expect(result.eligibility_rules.eligible_evidence).toBe(true);
    expect(result.eligibility_rules.tenant_scope_enforced).toBe(true);
    expect(result.governance_validator.learning_allowed).toBe(true);
    expect(result.governance_validator.tenant_isolation).toBe(true);
    expect(result.governance_validator.authority_boundaries).toBe(true);
    expect(result.cross_operational_analyzer.cross_tenant_learning_authorized).toBe(true);
    expect(result.cross_operational_analyzer.tenant_isolation_policy_applied).toBe(true);
  });

  it("stores append-only operational memory without rewriting history", () => {
    const result = runOperationalLearningEngine();

    expect(result.operational_memory.append_only).toBe(true);
    expect(result.operational_memory.historical_records_modified).toBe(false);
    expect(result.operational_memory.validated_patterns).toHaveLength(10);
    expect(result.operational_memory.operational_intelligence).toHaveLength(10);
    expect(result.pattern_registry.immutable_patterns).toBe(true);
    expect(result.pattern_registry.patterns.every((pattern) => pattern.immutable_after_approval)).toBe(true);
  });

  it("qualifies patterns from all governed learning domains", () => {
    const result = runOperationalLearningEngine();

    expect(result.pattern_learning_service.pattern_types).toHaveLength(10);
    expect(result.pattern_learning_service.deterministic_discovery).toBe(true);
    expect(result.pattern_registry.patterns).toHaveLength(10);
    expect(result.pattern_registry.patterns.every((pattern) => pattern.qualification_status === "QUALIFIED")).toBe(true);
    expect(result.pattern_registry.patterns.every((pattern) => pattern.evidence_refs.length > 0 && pattern.replay_refs.length > 0)).toBe(true);
  });

  it("records candidates and learning lineage for all operational sources", () => {
    const result = runOperationalLearningEngine();

    expect(result.candidate_registry.candidates).toHaveLength(12);
    expect(result.candidate_registry.candidates.every((candidate) => candidate.validation_status === "VALIDATED")).toBe(true);
    expect(result.candidate_registry.candidates.every((candidate) => candidate.replay_status === "REPLAY_VALIDATED")).toBe(true);
    expect(result.lineage_ledger.append_only).toBe(true);
    expect(result.lineage_ledger.records).toHaveLength(12);
    expect(result.lineage_ledger.records.every((record) => record.learning_outcome === "APPROVED")).toBe(true);
    expect(result.lineage_ledger.records.every((record) => record.certification_refs.length > 0)).toBe(true);
  });

  it("keeps operational learning visible through the observability dashboard", () => {
    const result = runOperationalLearningEngine();

    expect(result.observability_dashboard.learning_throughput_visible).toBe(true);
    expect(result.observability_dashboard.eligibility_decisions_visible).toBe(true);
    expect(result.observability_dashboard.replay_validation_visible).toBe(true);
    expect(result.observability_dashboard.governance_status_visible).toBe(true);
    expect(result.observability_dashboard.opaque_learning_prevented).toBe(true);
  });

  it("certifies the Phase 18.3 exit criteria", () => {
    const result = runOperationalLearningEngine();

    expect(result.certification_package.deterministic_learning).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.eligibility_governed).toBe(true);
    expect(result.certification_package.immutable_operational_memory_verified).toBe(true);
    expect(result.certification_package.pattern_qualification_operational).toBe(true);
    expect(result.certification_package.governance_enforcement_validated).toBe(true);
    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.authority_boundaries_enforced).toBe(true);
    expect(result.certification_package.learning_lineage_complete).toBe(true);
    expect(result.certification_package.operational_intelligence_reproducible).toBe(true);
    expect(result.certification_package.certification_integration_verified).toBe(true);
    expect(result.certification_package.operational_learning_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runOperationalLearningEngine();
    const second = runOperationalLearningEngine();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalLearningEngine(first).valid).toBe(true);
    expect(replayOperationalLearningEngine(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runOperationalLearningEngine({
      scenario: "NON_CONSTITUTIONAL_LEARNING_WARNING",
    });
    const validation = validateOperationalLearningEngine(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_LEARNING_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runOperationalLearningEngine({ scenario });
    const validation = validateOperationalLearningEngine(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runOperationalLearningEngine();
    const tamperedMemory: OperationalLearningResult = {
      ...result,
      operational_memory: {
        ...result.operational_memory,
        append_only: false,
      },
    };
    const tamperedReplay: OperationalLearningResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const memoryValidation = validateOperationalLearningEngine(tamperedMemory);
    const replayValidation = validateOperationalLearningEngine(tamperedReplay);

    expect(memoryValidation.valid).toBe(false);
    expect(memoryValidation.memory_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
