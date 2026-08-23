import { describe, expect, it } from "vitest";

import {
  assessConstitutionalAdmission,
  CONSTITUTIONAL_INVARIANTS,
  KNOWLEDGE_CLASSIFICATIONS,
  KNOWLEDGE_DISPOSITIONS,
  KNOWLEDGE_SCOPES,
  LEARNING_PIPELINE_STAGES,
  type ConstitutionalAdmissionRequest,
} from "@/types/learning-constitution";

const readyCandidate = (
  overrides: Partial<ConstitutionalAdmissionRequest> = {},
): ConstitutionalAdmissionRequest => ({
  candidateCreated: true,
  classification: "FACT",
  scope: "PROJECT",
  conflictDetectionCompleted: true,
  conflictRelationship: "UNRELATED",
  validationStatus: "VALID",
  approvalRequired: false,
  approved: false,
  provenanceComplete: true,
  ...overrides,
});

describe("Learning Constitution vocabulary", () => {
  it("fixes the canonical pipeline order", () => {
    expect(LEARNING_PIPELINE_STAGES).toEqual([
      "OBSERVATION",
      "CLASSIFICATION",
      "SCOPE_DETERMINATION",
      "CONFLICT_DETECTION",
      "VALIDATION",
      "LEARNING_DECISION",
      "DURABLE_KNOWLEDGE",
    ]);
  });

  it("defines the GP-01 classification, scope, and decision vocabularies", () => {
    expect(KNOWLEDGE_CLASSIFICATIONS).toHaveLength(12);
    expect(KNOWLEDGE_SCOPES).toHaveLength(12);
    expect(KNOWLEDGE_DISPOSITIONS).toEqual([
      "ACCEPT",
      "REJECT",
      "DEFER",
      "REQUIRE_VALIDATION",
      "REQUIRE_APPROVAL",
      "CONFLICT",
      "QUARANTINE",
    ]);
  });

  it("makes authority separation and non-learning defaults explicit invariants", () => {
    expect(CONSTITUTIONAL_INVARIANTS).toContain("CONVERSATION_IS_NOT_AUTOMATICALLY_LEARNING");
    expect(CONSTITUTIONAL_INVARIANTS).toContain("NON_LEARNING_IS_THE_DEFAULT");
    expect(CONSTITUTIONAL_INVARIANTS).toContain("LEARNING_DOES_NOT_GRANT_AUTHORITY");
    expect(CONSTITUTIONAL_INVARIANTS).toContain("DURABLE_PROVENANCE_MUST_BE_RECONSTRUCTABLE");
    expect(CONSTITUTIONAL_INVARIANTS).toContain("PROVENANCE_HISTORY_IS_IMMUTABLE");
    expect(CONSTITUTIONAL_INVARIANTS).toContain("HISTORICAL_TRUTH_IS_DISTINCT_FROM_CURRENT_TRUTH");
  });
});

describe("constitutional admission scenarios", () => {
  it("A: treats casual conversation as an observation, not durable learning", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({
        candidateCreated: false,
        classification: undefined,
        scope: undefined,
        conflictDetectionCompleted: false,
        conflictRelationship: undefined,
        validationStatus: "NOT_VALIDATED",
        provenanceComplete: false,
      }),
    );

    expect(decision).toEqual({
      disposition: "DEFER",
      reason: "OBSERVATION_ONLY",
      durableAdmissionEligible: false,
      authorityEffect: "UNCHANGED",
    });
  });

  it.each(["BRAINSTORMING", "SUGGESTION"] as const)(
    "B: keeps %s non-durable",
    (classification) => {
      const decision = assessConstitutionalAdmission(readyCandidate({ classification }));

      expect(decision.disposition).toBe("DEFER");
      expect(decision.durableAdmissionEligible).toBe(false);
    },
  );

  it("C: requires validation for an explicit scoped project decision", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({
        classification: "PROJECT_DECISION",
        validationStatus: "REQUIRES_VALIDATION",
      }),
    );

    expect(decision.disposition).toBe("REQUIRE_VALIDATION");
    expect(decision.durableAdmissionEligible).toBe(false);
  });

  it("D: preserves correction semantics while requiring validation", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({
        classification: "CORRECTION",
        conflictRelationship: "CORRECTS",
        validationStatus: "REQUIRES_VALIDATION",
      }),
    );

    expect(decision.disposition).toBe("REQUIRE_VALIDATION");
    expect(decision.authorityEffect).toBe("UNCHANGED");
  });

  it("E: never changes authority even when knowledge is admission-ready", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ classification: "PROCEDURE" }),
    );

    expect(decision.disposition).toBe("ACCEPT");
    expect(decision.durableAdmissionEligible).toBe(true);
    expect(decision.authorityEffect).toBe("UNCHANGED");
  });

  it("rejects attempts to mutate authority through learning", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ authorityMutationRequested: true }),
    );

    expect(decision.disposition).toBe("REJECT");
    expect(decision.reason).toBe("AUTHORITY_MUTATION_PROHIBITED");
    expect(decision.authorityEffect).toBe("UNCHANGED");
  });

  it("F: rejects attempts to amend the constitution through normal learning", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ constitutionalMutationRequested: true }),
    );

    expect(decision.disposition).toBe("REJECT");
    expect(decision.reason).toBe("CONSTITUTIONAL_CONFLICT");
  });

  it("G: fails closed when scope is unknown", () => {
    const decision = assessConstitutionalAdmission(readyCandidate({ scope: undefined }));

    expect(decision.disposition).toBe("DEFER");
    expect(decision.reason).toBe("MISSING_SCOPE");
  });

  it("fails closed when classification is missing", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ classification: undefined }),
    );

    expect(decision.disposition).toBe("DEFER");
    expect(decision.reason).toBe("MISSING_CLASSIFICATION");
  });

  it("fails closed when conflict detection is incomplete", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({
        conflictDetectionCompleted: false,
        conflictRelationship: undefined,
      }),
    );

    expect(decision.disposition).toBe("DEFER");
    expect(decision.reason).toBe("CONFLICT_CHECK_INCOMPLETE");
  });

  it("does not silently resolve a direct conflict", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ conflictRelationship: "CONTRADICTS" }),
    );

    expect(decision.disposition).toBe("CONFLICT");
    expect(decision.durableAdmissionEligible).toBe(false);
  });

  it("fails closed when conflict comparison is uncertain", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ conflictRelationship: "UNCERTAIN" }),
    );

    expect(decision.disposition).toBe("CONFLICT");
    expect(decision.durableAdmissionEligible).toBe(false);
  });

  it("quarantines otherwise-ready candidates with missing provenance", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ provenanceComplete: false }),
    );

    expect(decision.disposition).toBe("QUARANTINE");
    expect(decision.reason).toBe("PROVENANCE_MISSING");
  });

  it("quarantines provenance that cannot reconstruct its historical chain", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ provenanceReconstructable: false }),
    );

    expect(decision).toMatchObject({
      disposition: "QUARANTINE",
      reason: "PROVENANCE_NOT_RECONSTRUCTABLE",
      durableAdmissionEligible: false,
    });
  });

  it("requires outstanding approval after validation succeeds", () => {
    const decision = assessConstitutionalAdmission(
      readyCandidate({ approvalRequired: true, approved: false }),
    );

    expect(decision.disposition).toBe("REQUIRE_APPROVAL");
    expect(decision.reason).toBe("APPROVAL_REQUIRED");
  });

  it("accepts only after every constitutional prerequisite completes", () => {
    expect(assessConstitutionalAdmission(readyCandidate())).toEqual({
      disposition: "ACCEPT",
      reason: "READY_FOR_DURABLE_ADMISSION",
      durableAdmissionEligible: true,
      authorityEffect: "UNCHANGED",
    });
  });
});
