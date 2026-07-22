import { describe, expect, it } from "vitest";
import {
  buildConstitutionalReplayObservabilitySurface,
  getConstitutionalReplayReports,
  getConstitutionalReplayValidationEngine,
  listConstitutionalReplayEvidence,
  listConstitutionalReplayLedger,
  listConstitutionalReplayMatrix,
  listConstitutionalReplayMismatches,
  validateConstitutionalReplay,
  validateConstitutionalReplayRepository,
} from "@/services/constitutional-replay-validation";
import type { ConstitutionalReplayDomain, ConstitutionalReplayFailure, ConstitutionalReplayScenario } from "@/types/constitutional-replay-validation";

const domains: readonly ConstitutionalReplayDomain[] = ["VALIDATION", "MONITORING", "VIOLATION", "RECOMMENDATION", "CONFIDENCE", "ASSESSMENT", "DASHBOARD"];

describe("constitutional replay validation", () => {
  it("publishes the deterministic replay validation bundle", () => {
    const bundle = getConstitutionalReplayValidationEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-replay-validation/v8ALT.10.7");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_REPLAY_VALIDATION_READY");
    expect(bundle.doctrine.replay_domains).toEqual(domains);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.replay_only).toBe(true);
    expect(bundle.repository.historical_mutation_authorized).toBe(false);
    expect(bundle.repository.evidence_regeneration_authorized).toBe(false);
    expect(bundle.repository.execution_influence_authorized).toBe(false);
    expect(bundle.repository.governance_change_authorized).toBe(false);
    expect(bundle.repository.authority_change_authorized).toBe(false);
  });

  it("replays every domain identically in baseline mode", () => {
    const repository = validateConstitutionalReplay();

    expect(repository.final_state).toBe("CONSTITUTIONAL_REPLAY_VALIDATION_COMPLETE");
    expect(repository.report.overall_replay_status).toBe("VERIFIED");
    expect(repository.report.mismatch_count).toBe(0);
    expect(repository.mismatches).toEqual([]);
    expect(repository.matrix.every((entry) => entry.verification === "Identical")).toBe(true);
  });

  it("lists reports, matrix, mismatches, evidence, and ledger", () => {
    expect(getConstitutionalReplayReports().overall_replay_status).toBe("VERIFIED");
    expect(listConstitutionalReplayMatrix().length).toBe(12);
    expect(listConstitutionalReplayMismatches()).toEqual([]);
    expect(listConstitutionalReplayEvidence().length).toBe(1);
    expect(listConstitutionalReplayLedger().length).toBe(1);
  });

  it("keeps replay deterministic and append-only", () => {
    const first = validateConstitutionalReplay();
    const second = validateConstitutionalReplay();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.report.integrity_hash).toBe(first.report.integrity_hash);
    expect(first.evidence_packages.every((item) => item.immutable)).toBe(true);
    expect(first.ledger.every((item) => item.immutable && item.append_only)).toBe(true);
  });

  it("creates complete replay evidence packages", () => {
    const repository = validateConstitutionalReplay();
    const evidence = repository.evidence_packages[0];

    expect(evidence.original_execution_reference).toBeTruthy();
    expect(evidence.replay_execution_reference).toBe(repository.report.replay_reference);
    expect(evidence.constitutional_rules_evaluated.length).toBeGreaterThan(0);
    expect(evidence.comparison_results.length).toBe(12);
    expect(evidence.evidence_chain.length).toBeGreaterThan(0);
    expect(evidence.governance_references.length).toBeGreaterThan(0);
    expect(evidence.authority_references.length).toBeGreaterThan(0);
    expect(evidence.confidence_calculations.length).toBeGreaterThan(0);
    expect(evidence.replay_timeline).toEqual(["load-history", "restore-state", "replay-events", "compare-results", "verify-hashes"]);
  });

  it.each([
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["ORDERING_MISMATCH", "ORDERING_MISMATCH_DETECTED"],
    ["STATE_MISMATCH", "STATE_MISMATCH_DETECTED"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH_DETECTED"],
    ["HASH_MISMATCH", "HASH_MISMATCH_DETECTED"],
    ["EVIDENCE_MISMATCH", "EVIDENCE_MISMATCH_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH_DETECTED"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_MISMATCH_DETECTED"],
    ["RECOMMENDATION_MISMATCH", "RECOMMENDATION_MISMATCH_DETECTED"],
    ["DASHBOARD_MISMATCH", "DASHBOARD_MISMATCH_DETECTED"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION_DETECTED"],
    ["REPLAY_NONDETERMINISM", "REPLAY_NONDETERMINISM_DETECTED"],
    ["INCOMPLETE_CONSTITUTIONAL_HISTORY", "CONSTITUTIONAL_HISTORY_INCOMPLETE"],
    ["INTEGRITY_VERIFICATION_FAILURE", "REPLAY_INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_ISOLATION_VIOLATION", "REPLAY_TENANT_ISOLATION_VIOLATION"],
    ["MISSING_REPLAY_EVIDENCE", "REPLAY_EVIDENCE_MISSING"],
  ] satisfies [ConstitutionalReplayScenario, ConstitutionalReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = validateConstitutionalReplay({ scenario });
    const validation = validateConstitutionalReplayRepository(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_REPLAY_VALIDATION_FAIL_CLOSED");
    expect(repository.failures).toContain(failure);
    expect(repository.mismatches.some((item) => item.mismatch_type === failure)).toBe(true);
    expect(repository.report.mismatch_count).toBe(1);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(validation.fail_closed_ready).toBe(true);
    expect(repository.historical_mutation_authorized).toBe(false);
  });

  it("validates failure-specific replay controls", () => {
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "CONFIDENCE_MISMATCH" })).confidence_replay_identical).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "RECOMMENDATION_MISMATCH" })).recommendation_replay_identical).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "DASHBOARD_MISMATCH" })).dashboard_replay_identical).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "MISSING_REPLAY_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "LINEAGE_CORRUPTION" })).lineage_complete).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "INTEGRITY_VERIFICATION_FAILURE" })).integrity_verified).toBe(false);
    expect(validateConstitutionalReplayRepository(validateConstitutionalReplay({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes replay observability for certification dashboards", () => {
    const surface = buildConstitutionalReplayObservabilitySurface(validateConstitutionalReplay({ scenario: "HASH_MISMATCH" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_REPLAY_VALIDATION_FAIL_CLOSED");
    expect(surface.overall_status).toBe("FAILED");
    expect(surface.mismatch_count).toBe(1);
    expect(surface.matrix_count).toBe(12);
    expect(surface.evidence_count).toBe(1);
    expect(surface.ledger_count).toBe(1);
    expect(surface.replay_only).toBe(true);
    expect(surface.historical_mutation_authorized).toBe(false);
    expect(surface.evidence_regeneration_authorized).toBe(false);
  });
});
