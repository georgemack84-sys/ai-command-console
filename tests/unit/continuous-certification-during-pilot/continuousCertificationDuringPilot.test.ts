import { describe, expect, it } from "vitest";
import {
  getContinuousCertificationDuringPilotBundle,
  replayContinuousCertificationDuringPilot,
  runContinuousCertificationDuringPilot,
  validateContinuousCertificationDuringPilot,
} from "@/services/continuous-certification-during-pilot";
import type { ContinuousCertificationFailure } from "@/types/continuous-certification-during-pilot";

describe("Mission Control Phase 16.11 Continuous Certification During Pilot", () => {
  it("publishes continuous certification doctrine", () => {
    const bundle = getContinuousCertificationDuringPilotBundle();

    expect(bundle.doctrine.version).toBe("continuous-certification-during-pilot/v16.11");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-expansion-governance/v16.10");
    expect(bundle.doctrine.certification_states).toEqual(["CERTIFIED", "CONDITIONALLY_CERTIFIED", "UNDER_REVIEW", "RECERTIFICATION_REQUIRED", "SUSPENDED", "REVOKED"]);
    expect(bundle.doctrine.triggers).toHaveLength(12);
    expect(bundle.validation.valid).toBe(true);
  });

  it("runs a continuous certification engine over every trigger", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.engine.cycle_triggers).toHaveLength(12);
    expect(result.engine.cycles_scheduled).toBe(true);
    expect(result.engine.constitutional_guarantees_evaluated).toBe(true);
    expect(result.engine.deterministic).toBe(true);
    expect(result.engine.replayable).toBe(true);
  });

  it("validates every constitutional category", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.compliance_validator.results).toHaveLength(7);
    expect(result.compliance_validator.results.every((entry) => entry.status === "PASS" && entry.deterministic && entry.evidence_refs.length > 0)).toBe(true);
    expect(result.compliance_validator.violations_detected).toHaveLength(0);
  });

  it("produces a certified pilot certification record", () => {
    const result = runContinuousCertificationDuringPilot({ evaluation_reason: "OPERATOR_ACTION", scope_version: "pilot-scope-v2" });

    expect(result.certification_record.certification_state).toBe("CERTIFIED");
    expect(result.certification_record.evaluation_reason).toBe("OPERATOR_ACTION");
    expect(result.certification_record.scope_version).toBe("pilot-scope-v2");
    expect(result.certification_record.review_required).toBe(false);
    expect(result.certification_record.evidence_refs.length).toBeGreaterThan(0);
  });

  it("maintains append-only immutable certification ledger", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.certification_ledger.records).toHaveLength(1);
    expect(result.certification_ledger.entries).toHaveLength(7);
    expect(result.certification_ledger.append_only).toBe(true);
    expect(result.certification_ledger.immutable).toBe(true);
    expect(result.certification_ledger.entries.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("publishes complete certification dashboard visibility", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.dashboard.overall_certification_state).toBe("CERTIFIED");
    expect(result.dashboard.operational).toBe(true);
    expect(result.dashboard.active_violations_visible).toBe(true);
    expect(result.dashboard.historical_trend_visible).toBe(true);
    expect(result.dashboard.active_violations).toHaveLength(0);
  });

  it("reuses the centralized evidence platform", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.evidence_platform.evidence_platform_reused).toBe(true);
    expect(result.evidence_platform.duplicate_evidence_infrastructure_created).toBe(false);
    expect(result.evidence_platform.immutable_audit_reused).toBe(true);
    expect(result.evidence_platform.certification_linkage_reused).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runContinuousCertificationDuringPilot();
    const second = runContinuousCertificationDuringPilot();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousCertificationDuringPilot(first).valid).toBe(true);
    expect(replayContinuousCertificationDuringPilot(first)).toBe(true);
  });

  it("executes the Phase 16.11 certification matrix", () => {
    const result = runContinuousCertificationDuringPilot();

    expect(result.certification_tests).toHaveLength(15);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Continuous certification operational",
      "Violations detected",
      "Evidence complete",
      "Certification decisions deterministic",
      "Certification history immutable",
      "Constitutional compliance continuously verified",
      "Advisory-only boundary continuously enforced",
      "Tenant isolation continuously validated",
      "Replay integrity continuously verified",
      "Deployment integrity continuously validated",
      "Certification dashboard operational",
      "Governance review integrated",
      "Fail-closed behavior validated",
      "Centralized evidence platform reused",
      "Phase 16.10 expansion governance valid",
    ]);
  });

  it("supports conditional certification for non-constitutional warnings", () => {
    const result = runContinuousCertificationDuringPilot({ scenario: "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" });
    const validation = validateContinuousCertificationDuringPilot(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_record.certification_state).toBe("CONDITIONALLY_CERTIFIED");
    expect(validation.valid).toBe(false);
  });

  it("detects violation drift and fails closed", () => {
    const result = runContinuousCertificationDuringPilot({ scenario: "TENANT_ISOLATION_NOT_VALIDATED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.compliance_validator.violations_detected).toContain("TENANT_ISOLATION_NOT_VALIDATED");
    expect(result.certification_record.certification_state).toBe("SUSPENDED");
    expect(result.certification_record.review_required).toBe(true);
  });

  it("revokes certification for advisory boundary violations", () => {
    const result = runContinuousCertificationDuringPilot({ scenario: "ADVISORY_BOUNDARY_NOT_ENFORCED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.certification_record.certification_state).toBe("REVOKED");
    expect(result.compliance_validator.advisory_boundary_valid).toBe(false);
  });

  it.each([
    "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL",
    "VIOLATIONS_NOT_DETECTED",
    "EVIDENCE_INCOMPLETE",
    "CERTIFICATION_DECISIONS_NON_DETERMINISTIC",
    "CERTIFICATION_HISTORY_MUTABLE",
    "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED",
    "ADVISORY_BOUNDARY_NOT_ENFORCED",
    "TENANT_ISOLATION_NOT_VALIDATED",
    "REPLAY_INTEGRITY_NOT_VERIFIED",
    "DEPLOYMENT_INTEGRITY_NOT_VALIDATED",
    "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL",
    "GOVERNANCE_REVIEW_NOT_INTEGRATED",
    "FAIL_CLOSED_NOT_VALIDATED",
    "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED",
    "PHASE_16_10_EXPANSION_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ContinuousCertificationFailure) => {
    const result = runContinuousCertificationDuringPilot({ scenario });
    const validation = validateContinuousCertificationDuringPilot(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested certification record tampering", () => {
    const result = runContinuousCertificationDuringPilot();
    const tampered = {
      ...result,
      certification_record: {
        ...result.certification_record,
        certification_state: "REVOKED" as const,
      },
    };

    expect(validateContinuousCertificationDuringPilot(tampered).valid).toBe(false);
  });
});
