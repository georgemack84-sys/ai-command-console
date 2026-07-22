import { describe, expect, it } from "vitest";
import {
  getConsumerAdoptionMigrationBundle,
  replayConsumerAdoptionMigration,
  runConsumerAdoptionMigration,
  validateConsumerAdoptionMigration,
} from "@/services/caf-consumer-adoption-migration";
import type { ConsumerAdoptionMigrationScenario } from "@/types/caf-consumer-adoption-migration";

describe("Program 3 P3.17 Consumer Adoption and Migration", () => {
  it("publishes adoption doctrine without owning certification, deployment, operations, or assurance", () => {
    const bundle = getConsumerAdoptionMigrationBundle();

    expect(bundle.doctrine.version).toBe("caf-consumer-adoption-migration/v3.17");
    expect(bundle.doctrine.owns_migration_planning).toBe(true);
    expect(bundle.doctrine.owns_adoption_governance).toBe(true);
    expect(bundle.doctrine.owns_platform_certification).toBe(false);
    expect(bundle.doctrine.owns_sdk_certification).toBe(false);
    expect(bundle.doctrine.owns_runtime_deployment).toBe(false);
    expect(bundle.doctrine.owns_operational_governance).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("governs deterministic consumer adoption from certified platform and SDK inputs", () => {
    const first = runConsumerAdoptionMigration();
    const second = runConsumerAdoptionMigration();

    expect(first.platform_certification_ref).toBe("caf-platform-certification/v3.15");
    expect(first.sdk_interface_qualification_ref).toBe("caf-sdk-interface-qualification/v3.16");
    expect(first.migration_plan.approved).toBe(true);
    expect(first.readiness_assessment.result).toBe("READY");
    expect(first.compatibility_result.verified_before_rollout).toBe(true);
    expect(first.adoption_decision.decision).toBe("APPROVE");
    expect(first.rollout_status.authorized).toBe(true);
    expect(first.transition_record.operational_continuity_preserved).toBe(true);
    expect(first.migration_evidence.immutable).toBe(true);
    expect(first.adoption_report.generated).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateConsumerAdoptionMigration(first).valid).toBe(true);
    expect(replayConsumerAdoptionMigration(first)).toBe(true);
  });

  it("enforces lifecycle, rollback, evidence, lineage, and constitutional governance", () => {
    const result = runConsumerAdoptionMigration();

    expect(result.migration_plan.sequencing.at(0)).toBe("PLANNED");
    expect(result.migration_plan.sequencing.at(-1)).toBe("COMPLETED");
    expect(result.rollout_status.rollback_triggers.length).toBeGreaterThan(0);
    expect(result.migration_evidence.complete).toBe(true);
    expect(result.migration_evidence.lineage_refs.length).toBeGreaterThan(0);
    expect(result.certification.constitutional_governance_enforced).toBe(true);
    expect(result.certification.certified_platform_only).toBe(true);
    expect(result.certification.certified_sdks_only).toBe(true);
  });

  it.each([
    "P3_15_PLATFORM_CERTIFICATE_INVALID",
    "P3_16_SDK_INTERFACE_INVALID",
    "PLATFORM_CERTIFICATION_DUPLICATED",
    "SDK_CERTIFICATION_DUPLICATED",
    "RUNTIME_DEPLOYMENT_ATTEMPTED",
    "OPERATIONAL_GOVERNANCE_DUPLICATED",
    "PLATFORM_ASSURANCE_DUPLICATED",
    "MIGRATION_PLAN_MISSING",
    "MIGRATION_LIFECYCLE_BYPASSED",
    "READINESS_ASSESSMENT_FAILED",
    "COMPATIBILITY_NOT_VERIFIED",
    "INCOMPATIBLE_CONSUMER_APPROVED",
    "GOVERNANCE_APPROVAL_MISSING",
    "ROLLOUT_NOT_AUTHORIZED",
    "ROLLOUT_SEQUENCE_NON_DETERMINISTIC",
    "TRANSITION_CONTINUITY_LOST",
    "ROLLBACK_GOVERNANCE_MISSING",
    "MIGRATION_EVIDENCE_MISSING",
    "MIGRATION_EVIDENCE_MUTABLE",
    "MIGRATION_LINEAGE_INCOMPLETE",
    "ADOPTION_REPORT_MISSING",
    "UNCERTIFIED_PLATFORM_MIGRATION_ALLOWED",
    "UNCERTIFIED_SDK_MIGRATION_ALLOWED",
    "CONSTITUTIONAL_GOVERNANCE_BYPASSED",
  ] as const)("fails migration certification for %s", (scenario: ConsumerAdoptionMigrationScenario) => {
    const result = runConsumerAdoptionMigration({ scenario });
    const validation = validateConsumerAdoptionMigration(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned adoption outcomes", () => {
    const result = runConsumerAdoptionMigration({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
