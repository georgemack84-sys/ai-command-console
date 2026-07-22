import { describe, expect, it } from "vitest";
import {
  getReplayStabilityIntegrityBundle,
  replayReplayStabilityIntegrity,
  runReplayStabilityIntegrity,
  validateReplayStabilityIntegrity,
} from "@/services/replay-stability-integrity";
import type { ReplayStabilityIntegrityFailure, ReplayStabilityIntegrityResult } from "@/types/replay-stability-integrity";

const failureScenarios: ReplayStabilityIntegrityFailure[] = [
  "REPLAY_STABILITY_NOT_CONTINUOUSLY_VERIFIED",
  "REPLAY_REGRESSIONS_NOT_DETERMINISTIC",
  "REPLAY_BASELINES_MUTABLE",
  "INTEGRITY_NOT_CONTINUOUSLY_VALIDATED",
  "REPLAY_DIVERGENCE_NOT_CLASSIFIED",
  "EVIDENCE_NOT_REPRODUCIBLE",
  "REPLAY_LINEAGE_INCOMPLETE",
  "SUPERSESSION_NOT_ADDITIVE",
  "FAIL_CLOSED_NOT_VERIFIED",
  "CONSTITUTIONAL_INTEGRITY_NOT_PRESERVED",
  "REPLAY_STABILITY_NOT_CERTIFIED",
  "HISTORICAL_RECORD_MUTATED",
  "UNKNOWN_REPLAY_CONDITION_NOT_FAIL_CLOSED",
  "PHASE_18_9_RISK_NOT_VALID",
];

describe("replay stability integrity", () => {
  it("publishes the Phase 18.10 doctrine and validates the baseline bundle", () => {
    const bundle = getReplayStabilityIntegrityBundle();

    expect(bundle.doctrine.version).toBe("replay-stability-integrity/v18.10");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-risk-intelligence/v18.9");
    expect(bundle.doctrine.stability_classifications).toEqual([
      "STABLE",
      "MINOR_VARIANCE",
      "REGRESSION_DETECTED",
      "INTEGRITY_FAILURE",
      "GOVERNANCE_DIVERGENCE",
      "DEPENDENCY_DIVERGENCE",
      "INFRASTRUCTURE_DIVERGENCE",
      "UNEXPLAINED_DIVERGENCE",
    ]);
    expect(bundle.doctrine.regression_categories).toHaveLength(10);
    expect(bundle.doctrine.divergence_types).toHaveLength(12);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("runs as a continuous lifecycle-independent stability monitor", () => {
    const result = runReplayStabilityIntegrity();

    expect(result.stability_monitor.standing_constitutional_service).toBe(true);
    expect(result.stability_monitor.lifecycle_independent).toBe(true);
    expect(result.stability_monitor.continuous_verification).toBe(true);
    expect(Object.entries(result.stability_monitor.health_record).filter(([key]) => !["health_id", "integrity_hash"].includes(key)).every(([, value]) => value === true)).toBe(true);
  });

  it("detects replay regressions deterministically and validates integrity continuously", () => {
    const result = runReplayStabilityIntegrity();

    expect(result.regression_engine.deterministic_detection).toBe(true);
    expect(result.regression_engine.regression_categories).toEqual(["EXECUTION", "ORDERING", "DEPENDENCY", "INFRASTRUCTURE", "GOVERNANCE", "POLICY", "OPTIMIZATION", "LEARNING", "CERTIFICATION", "EVIDENCE"]);
    expect(result.integrity_validator.continuous_validation).toBe(true);
    expect(result.integrity_validator.cryptographic_integrity).toBe(true);
    expect(result.integrity_validator.no_unauthorized_mutation).toBe(true);
    expect(result.integrity_validator.no_missing_evidence).toBe(true);
    expect(result.integrity_validator.no_orphaned_lineage).toBe(true);
  });

  it("preserves immutable baselines and additive replay stability records", () => {
    const result = runReplayStabilityIntegrity();
    const [previous, current] = result.baseline_registry.baselines;

    expect(result.baseline_registry.immutable_baselines).toBe(true);
    expect(result.baseline_registry.additive_supersession).toBe(true);
    expect(result.baseline_registry.historical_baselines_preserved).toBe(true);
    expect(result.baseline_registry.baselines).toHaveLength(2);
    expect(previous.immutable).toBe(true);
    expect(current.immutable).toBe(true);
    expect(current.supersedes).toBe(previous.integrity_hash);
    expect(result.stability_record.replay_result).toBe("STABLE");
    expect(result.stability_record.integrity_validation_result).toBe("PASS");
    expect(result.stability_record.replay_reference).toBeTruthy();
    expect(result.stability_record.evidence_references.length).toBeGreaterThan(0);
  });

  it("classifies divergence fail-closed and emits reproducible evidence", () => {
    const result = runReplayStabilityIntegrity();

    expect(result.divergence_analysis.divergence_types).toHaveLength(12);
    expect(result.divergence_analysis.deterministic_classification).toBe(true);
    expect(result.divergence_analysis.unknown_conditions_fail_closed).toBe(true);
    expect(result.divergence_analysis.unexplained_divergence_blocks_certification).toBe(true);
    expect(result.evidence_service.immutable_evidence).toBe(true);
    expect(result.evidence_service.reproducible).toBe(true);
    expect(result.evidence_service.replay_outputs.length).toBeGreaterThan(0);
    expect(result.evidence_service.execution_traces.length).toBeGreaterThan(0);
    expect(result.evidence_service.dependency_snapshots.length).toBeGreaterThan(0);
    expect(result.evidence_service.infrastructure_fingerprints.length).toBeGreaterThan(0);
  });

  it("maintains an immutable ledger and certifies Phase 18.10 exit criteria", () => {
    const result = runReplayStabilityIntegrity();

    expect(result.stability_ledger.additive_only).toBe(true);
    expect(result.stability_ledger.immutable).toBe(true);
    expect(result.stability_ledger.stability_records.length).toBeGreaterThan(0);
    expect(result.stability_ledger.baseline_refs).toHaveLength(2);
    expect(result.certification_package.replay_stability_continuously_verified).toBe(true);
    expect(result.certification_package.replay_regressions_detected_deterministically).toBe(true);
    expect(result.certification_package.replay_baselines_immutable).toBe(true);
    expect(result.certification_package.integrity_continuously_validated).toBe(true);
    expect(result.certification_package.replay_divergence_classified).toBe(true);
    expect(result.certification_package.evidence_reproducible).toBe(true);
    expect(result.certification_package.replay_lineage_complete).toBe(true);
    expect(result.certification_package.supersession_additive).toBe(true);
    expect(result.certification_package.fail_closed_behavior_verified).toBe(true);
    expect(result.certification_package.constitutional_integrity_preserved).toBe(true);
    expect(result.certification_package.replay_stability_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(11);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runReplayStabilityIntegrity();
    const second = runReplayStabilityIntegrity();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateReplayStabilityIntegrity(first).valid).toBe(true);
    expect(replayReplayStabilityIntegrity(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runReplayStabilityIntegrity({ scenario: "NON_CONSTITUTIONAL_REPLAY_WARNING" });
    const validation = validateReplayStabilityIntegrity(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_REPLAY_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runReplayStabilityIntegrity({ scenario });
    const validation = validateReplayStabilityIntegrity(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runReplayStabilityIntegrity();
    const tamperedLedger: ReplayStabilityIntegrityResult = {
      ...result,
      stability_ledger: {
        ...result.stability_ledger,
        immutable: false,
      },
    };
    const tamperedReplay: ReplayStabilityIntegrityResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const ledgerValidation = validateReplayStabilityIntegrity(tamperedLedger);
    const replayValidation = validateReplayStabilityIntegrity(tamperedReplay);

    expect(ledgerValidation.valid).toBe(false);
    expect(ledgerValidation.ledger_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
