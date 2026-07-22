import { describe, expect, it } from "vitest";
import {
  getAssuranceDependencyGovernanceBundle,
  replayAssuranceDependencyGovernance,
  runAssuranceDependencyGovernance,
  validateAssuranceDependencyGovernance,
} from "@/services/assurance-dependency-governance";
import type { DependencyGovernanceFailure } from "@/types/assurance-dependency-governance";

describe("Mission Control Phase 14.8 Assurance Dependency Governance", () => {
  it("publishes dependency governance doctrine", () => {
    const bundle = getAssuranceDependencyGovernanceBundle();

    expect(bundle.doctrine.version).toBe("assurance-dependency-governance/v14.8");
    expect(bundle.doctrine.scale_validation_phase).toBe("scale-stress-resilience-validation/v14.7");
    expect(bundle.doctrine.phase_13_default_status).toBe("UNVERIFIED");
    expect(bundle.doctrine.candidate_statuses).toEqual(["IDENTIFIED", "SEARCH_IN_PROGRESS", "SOURCE_LOCATED", "SOURCE_NOT_FOUND", "PROMOTED_TO_VERIFICATION", "REJECTED"]);
    expect(bundle.doctrine.dependency_statuses).toEqual(["UNVERIFIED", "VERIFICATION_IN_PROGRESS", "VERIFIED_COMPATIBLE", "VERIFIED_INCOMPATIBLE", "MISSING", "SUPERSEDED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps discovery non-normative while preserving candidate history", () => {
    const result = runAssuranceDependencyGovernance();

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].candidate_status).toBe("PROMOTED_TO_VERIFICATION");
    expect(result.candidates[0].promotion_refs).toHaveLength(1);
    expect(result.candidates[0].lineage_refs).toHaveLength(1);
    expect(result.blocking.discovery_artifacts_blocked_from_certification).toBe(true);
    expect(result.promotion.candidate_history_preserved).toBe(true);
  });

  it("publishes immutable manifest authority without mutating candidates", () => {
    const result = runAssuranceDependencyGovernance();

    expect(result.manifests).toHaveLength(1);
    expect(result.manifests[0].dependency_status).toBe("UNVERIFIED");
    expect(result.promotion.manifest_id).toBe(result.manifests[0].manifest_id);
    expect(result.promotion.compatibility_claimed).toBe(false);
    expect(result.promotion.authority_transition_explicit).toBe(true);
  });

  it("blocks Phase 13 assumptions while dependency is UNVERIFIED", () => {
    const result = runAssuranceDependencyGovernance();

    expect(result.blocking.dependency_status).toBe("UNVERIFIED");
    expect(result.blocking.infrastructure_permitted).toBe(true);
    expect(result.blocking.semantic_implementation_blocked).toBe(true);
    expect(result.blocking.phase_13_assumptions_blocked).toBe(true);
    expect(result.blocking.certification_gate_enforced).toBe(true);
  });

  it("allows verified compatible manifests to satisfy dependency gates", () => {
    const result = runAssuranceDependencyGovernance({ dependency_status: "VERIFIED_COMPATIBLE" });

    expect(result.manifests[0].dependency_status).toBe("VERIFIED_COMPATIBLE");
    expect(result.manifests[0].constitutional_validation).toBe(true);
    expect(result.manifests[0].semantic_validation).toBe(true);
    expect(result.manifests[0].version_validation).toBe(true);
    expect(result.manifests[0].governance_validation).toBe(true);
    expect(result.outcome).toBe("PASS");
  });

  it("records immutable governance lineage", () => {
    const result = runAssuranceDependencyGovernance();

    expect(result.governance_ledger).toHaveLength(7);
    expect(result.governance_ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.lineage_ref && entry.replay_ref)).toBe(true);
    expect(result.observability.alerts_operational).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runAssuranceDependencyGovernance();
    const second = runAssuranceDependencyGovernance();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAssuranceDependencyGovernance(first).valid).toBe(true);
    expect(replayAssuranceDependencyGovernance(first)).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runAssuranceDependencyGovernance();

    expect(result.certification_tests).toHaveLength(20);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Candidate lifecycle deterministic",
      "Discovery artifacts non-normative",
      "Candidate history immutable",
      "Candidate promotion replayable",
      "Manifest authority explicit",
      "Manifest immutable",
      "Verification deterministic",
      "Semantic verification reproducible",
      "Version verification reproducible",
      "Content hash verification reproducible",
      "Constitutional compatibility validated",
      "Verified manifests satisfy dependency gates",
      "Unverified manifests blocked",
      "Infrastructure implementation permitted",
      "Dependency semantics blocked while unverified",
      "Phase 13 assumptions prohibited while UNVERIFIED",
      "Governance lineage complete",
      "Replay reproducible",
      "Dependency blocking deterministic",
      "Certification dependency gate enforced",
    ]);
  });

  it("supports conditional pass for non-constitutional operational warnings", () => {
    const result = runAssuranceDependencyGovernance({ scenario: "NON_CONSTITUTIONAL_OPERATIONAL_WARNING" });
    const validation = validateAssuranceDependencyGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "CANDIDATE_LIFECYCLE_NON_DETERMINISTIC",
    "DISCOVERY_NORMATIVE_LEAK",
    "CANDIDATE_HISTORY_MUTABLE",
    "PROMOTION_NOT_REPLAYABLE",
    "MANIFEST_AUTHORITY_AMBIGUOUS",
    "MANIFEST_MUTABLE",
    "VERIFICATION_NON_DETERMINISTIC",
    "SEMANTIC_VERIFICATION_NOT_REPRODUCIBLE",
    "VERSION_VERIFICATION_NOT_REPRODUCIBLE",
    "CONTENT_HASH_VERIFICATION_NOT_REPRODUCIBLE",
    "CONSTITUTIONAL_COMPATIBILITY_INVALID",
    "UNVERIFIED_MANIFEST_NOT_BLOCKED",
    "INFRASTRUCTURE_BLOCKED",
    "DEPENDENCY_SEMANTICS_NOT_BLOCKED",
    "PHASE_13_ASSUMPTION_ALLOWED",
    "GOVERNANCE_LINEAGE_INCOMPLETE",
    "REPLAY_NOT_REPRODUCIBLE",
    "DEPENDENCY_BLOCKING_NON_DETERMINISTIC",
    "CERTIFICATION_GATE_NOT_ENFORCED",
    "OBSERVABILITY_UNAVAILABLE",
  ] as const)("fails certification for %s", (scenario: DependencyGovernanceFailure) => {
    const result = runAssuranceDependencyGovernance({ scenario });
    const validation = validateAssuranceDependencyGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested manifest tampering", () => {
    const result = runAssuranceDependencyGovernance();
    const tampered = {
      ...result,
      manifests: [
        {
          ...result.manifests[0],
          compatibility_summary: "tampered compatibility",
        },
      ],
    };

    expect(validateAssuranceDependencyGovernance(tampered).valid).toBe(false);
  });
});
