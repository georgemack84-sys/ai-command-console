import { describe, expect, it } from "vitest";
import {
  getLiveEvidenceCollectionBundle,
  replayLiveEvidenceCollection,
  runLiveEvidenceCollection,
  validateLiveEvidenceCollection,
} from "@/services/live-evidence-collection";
import type { LiveEvidenceCollectionFailure } from "@/types/live-evidence-collection";

describe("Mission Control Phase 16.4 Live Evidence Collection", () => {
  it("publishes live evidence collection doctrine", () => {
    const bundle = getLiveEvidenceCollectionBundle();

    expect(bundle.doctrine.version).toBe("live-evidence-collection/v16.4");
    expect(bundle.doctrine.upstream_phase).toBe("production-advisory-runtime/v16.3");
    expect(bundle.doctrine.lifecycle).toEqual(["EVIDENCE_GENERATED", "VALIDATED", "INTEGRITY_VERIFIED", "STORED", "LINKED_INTO_LINEAGE", "REPLAY_REFERENCED", "CERTIFICATION_REFERENCED", "IMMUTABLE_ARCHIVE"]);
    expect(bundle.doctrine.evidence_categories).toEqual(["OPERATIONAL", "RECOMMENDATION", "REPLAY", "INCIDENT", "CERTIFICATION", "GOVERNANCE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("captures immutable master and operational evidence", () => {
    const result = runLiveEvidenceCollection();

    expect(result.master_evidence.immutable).toBe(true);
    expect(result.master_evidence.append_only).toBe(true);
    expect(result.master_evidence.evidence_refs.length).toBeGreaterThan(0);
    expect(result.operational_evidence.fully_traceable).toBe(true);
    expect(result.operational_evidence.advisory_outputs.length).toBeGreaterThan(0);
  });

  it("captures recommendation, replay, and incident evidence", () => {
    const result = runLiveEvidenceCollection();

    expect(result.recommendation_evidence.operator_decision).toBe("ACKNOWLEDGED");
    expect(result.recommendation_evidence.supporting_evidence.length).toBeGreaterThan(0);
    expect(result.replay_evidence.deterministic_comparison).toBe(true);
    expect(result.replay_evidence.divergence_classification).toBe("NONE");
    expect(result.incident_evidence.severity).toBe("NONE");
    expect(result.incident_evidence.certification_impact).toBe("NONE");
  });

  it("reuses the unified constitutional evidence platform", () => {
    const result = runLiveEvidenceCollection();

    expect(result.registry.centralized_persistence).toBe(true);
    expect(result.registry.duplicate_infrastructure_created).toBe(false);
    expect(result.integration.no_parallel_architecture).toBe(true);
    expect(result.integration.reused_capabilities).toContain("lineage graph");
    expect(result.integration.extended_capabilities).toContain("Pilot Evidence Service");
  });

  it("validates integrity and unified lineage", () => {
    const result = runLiveEvidenceCollection();

    expect(result.integrity_validation.operational).toBe(true);
    expect(result.integrity_validation.cryptographic_integrity).toBe(true);
    expect(result.lineage.unified).toBe(true);
    expect(result.lineage.disconnected_lineage_count).toBe(0);
    expect(result.lineage.recommendation_to_certification_path.length).toBeGreaterThan(0);
  });

  it("preserves tenant isolation, governance, replay, and certification references", () => {
    const result = runLiveEvidenceCollection();

    expect(result.integration.tenant_isolated).toBe(true);
    expect(result.integration.governance_enforced).toBe(true);
    expect(result.integration.centralized_certification).toBe(true);
    expect(result.master_evidence.replay_refs.length).toBeGreaterThan(0);
    expect(result.master_evidence.certification_refs.length).toBeGreaterThan(0);
    expect(result.master_evidence.governance_refs.length).toBeGreaterThan(0);
  });

  it("is deterministic and replayable", () => {
    const first = runLiveEvidenceCollection();
    const second = runLiveEvidenceCollection();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateLiveEvidenceCollection(first).valid).toBe(true);
    expect(replayLiveEvidenceCollection(first)).toBe(true);
  });

  it("executes the Phase 16.4 evidence certification matrix", () => {
    const result = runLiveEvidenceCollection();

    expect(result.certification_tests).toHaveLength(11);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Evidence immutable",
      "Lineage unified",
      "Evidence platform reused",
      "Certification evidence integrated",
      "No duplicate evidence infrastructure created",
      "Replay references deterministic",
      "Integrity validation operational",
      "Tenant isolation verified",
      "Governance enforcement complete",
      "Operational evidence fully traceable",
      "Phase 16.3 runtime valid",
    ]);
  });

  it("supports conditional pass for non-constitutional evidence warnings", () => {
    const result = runLiveEvidenceCollection({ scenario: "NON_CONSTITUTIONAL_EVIDENCE_WARNING" });
    const validation = validateLiveEvidenceCollection(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "EVIDENCE_NOT_IMMUTABLE",
    "LINEAGE_NOT_UNIFIED",
    "EVIDENCE_PLATFORM_NOT_REUSED",
    "CERTIFICATION_EVIDENCE_NOT_INTEGRATED",
    "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED",
    "REPLAY_REFERENCES_NON_DETERMINISTIC",
    "INTEGRITY_VALIDATION_NOT_OPERATIONAL",
    "TENANT_ISOLATION_NOT_VERIFIED",
    "GOVERNANCE_ENFORCEMENT_INCOMPLETE",
    "OPERATIONAL_EVIDENCE_NOT_TRACEABLE",
    "PHASE_16_3_RUNTIME_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: LiveEvidenceCollectionFailure) => {
    const result = runLiveEvidenceCollection({ scenario });
    const validation = validateLiveEvidenceCollection(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested evidence tampering", () => {
    const result = runLiveEvidenceCollection();
    const tampered = {
      ...result,
      master_evidence: {
        ...result.master_evidence,
        immutable: false,
      },
    };

    expect(validateLiveEvidenceCollection(tampered).valid).toBe(false);
  });
});
