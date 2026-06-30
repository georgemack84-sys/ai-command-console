import { describe, expect, it } from "vitest";
import {
  buildTruthLineageCertificationRequest,
  sealTruthLineageCertificationGate,
} from "@/services/mission-control";
import type {
  SealedTruthCausalityGraph,
  SealedTruthEvolutionTracker,
  SealedTruthLineageContract,
  SealedTruthParentChildRelationshipEngine,
  TruthCertificationState,
  TruthLineageCertificationInput,
  TruthLineageCertificationScope,
} from "@/services/mission-control";

const scopes: readonly TruthLineageCertificationScope[] = [
  "LINEAGE_CONTRACT",
  "PARENT_CHILD_RELATIONSHIP_ENGINE",
  "CAUSALITY_GRAPH",
  "TRUTH_EVOLUTION_TRACKER",
  "REPLAY_PRESERVATION",
  "OWNERSHIP_INTEGRITY",
  "GOVERNANCE_TRACEABILITY",
  "TENANT_ISOLATION",
  "OPERATOR_VISIBILITY",
];

function sealedLineage(certification: TruthCertificationState = "PASS"): SealedTruthLineageContract {
  return {
    certification,
    validation: {
      valid: certification !== "FAIL",
      ownershipValid: certification !== "FAIL",
      governanceInfluenceValid: certification !== "FAIL",
      tenantIsolationValid: certification !== "FAIL",
    },
    visibility: { tenantScoped: certification !== "FAIL" },
  } as unknown as SealedTruthLineageContract;
}

function sealedRelationship(certification: TruthCertificationState = "PASS"): SealedTruthParentChildRelationshipEngine {
  return {
    certification,
    validation: {
      valid: certification !== "FAIL",
      tenantIsolationValid: certification !== "FAIL",
    },
    visibility: { tenantScoped: certification !== "FAIL" },
  } as unknown as SealedTruthParentChildRelationshipEngine;
}

function sealedCausality(certification: TruthCertificationState = "PASS"): SealedTruthCausalityGraph {
  return {
    certification,
    validation: {
      valid: certification !== "FAIL",
      influenceMapped: certification !== "FAIL",
      tenantIsolationValid: certification !== "FAIL",
    },
    visibility: { tenantScoped: certification !== "FAIL" },
  } as unknown as SealedTruthCausalityGraph;
}

function sealedEvolution(certification: TruthCertificationState = "PASS"): SealedTruthEvolutionTracker {
  return {
    certification,
    validation: {
      valid: certification !== "FAIL",
      tenantIsolationValid: certification !== "FAIL",
    },
    visibility: { tenantScoped: certification !== "FAIL" },
  } as unknown as SealedTruthEvolutionTracker;
}

function baseInput(overrides: Partial<TruthLineageCertificationInput> = {}): TruthLineageCertificationInput {
  return {
    request: buildTruthLineageCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-25T01:00:00.000Z",
    }),
    lineageLayerVersion: "6G.5.1",
    certificationScope: scopes,
    certificationAuthority: {
      authority_id: "lineage-certifier-alpha",
      authority_type: "CERTIFICATION_ENGINE",
      authority_scope: "LINEAGE_CERTIFICATION",
      authority_evidence: ["authority-evidence-alpha"],
    },
    evidenceReferences: ["lineage-evidence-alpha"],
    replayReferences: ["lineage-replay-alpha"],
    lineageContract: sealedLineage(),
    relationshipEngine: sealedRelationship(),
    causalityGraph: sealedCausality(),
    truthEvolution: sealedEvolution(),
    ...overrides,
  };
}

describe("lineageCertificationGate", () => {
  it("certifies the full lineage layer deterministically", () => {
    const first = sealTruthLineageCertificationGate(baseInput());
    const second = sealTruthLineageCertificationGate(baseInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.advancementState).toBe("LINEAGE_LAYER_CERTIFIED");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("certifies each required domain", () => {
    const result = sealTruthLineageCertificationGate(baseInput());

    expect(result.validation.lineageContractCertified).toBe(true);
    expect(result.validation.relationshipEngineCertified).toBe(true);
    expect(result.validation.causalityGraphCertified).toBe(true);
    expect(result.validation.truthEvolutionCertified).toBe(true);
    expect(result.validation.replayPreservationVerified).toBe(true);
    expect(result.validation.ownershipIntegrityVerified).toBe(true);
    expect(result.validation.governanceTraceabilityVerified).toBe(true);
    expect(result.validation.tenantIsolationCertified).toBe(true);
    expect(result.validation.operatorVisibilityCertified).toBe(true);
  });

  it("fails orphaned child detection", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ orphanedChildDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.relationshipEngineCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("ORPHANED_CHILD_DETECTED");
  });

  it("fails dependency cycles", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ dependencyCycleDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.causalityGraphCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("DEPENDENCY_CYCLE_DETECTED");
  });

  it("fails unresolved root cause", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ rootCauseUnresolvedDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.causalityGraphCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("ROOT_CAUSE_UNRESOLVED");
  });

  it("fails ownership corruption", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ ownershipCorruptionDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.ownershipIntegrityVerified).toBe(false);
    expect(result.validation.reasonCodes).toContain("OWNERSHIP_CORRUPTION_DETECTED");
  });

  it("fails missing governance influence", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ governanceInfluenceMissingDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.governanceTraceabilityVerified).toBe(false);
    expect(result.validation.reasonCodes).toContain("GOVERNANCE_INFLUENCE_MISSING");
  });

  it("fails cross-tenant lineage access", () => {
    const result = sealTruthLineageCertificationGate(baseInput({
      crossTenantLineageAccessDetected: true,
      crossTenantReplayDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("CROSS_TENANT_LINEAGE_ACCESS_DETECTED");
  });

  it("fails replay mismatches", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.replayPreservationVerified).toBe(false);
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });

  it("fails hidden lineage state", () => {
    const result = sealTruthLineageCertificationGate(baseInput({ hiddenLineageStateDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.operatorVisibilityCertified).toBe(false);
    expect(result.validation.reasonCodes).toContain("HIDDEN_LINEAGE_STATE_DETECTED");
  });

  it("fails missing certification contract inputs", () => {
    const result = sealTruthLineageCertificationGate(baseInput({
      certificationScope: [],
      evidenceReferences: [],
      replayReferences: [],
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.contractValid).toBe(false);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_SCOPE_MISSING");
    expect(result.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(result.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("allows conditional pass for documented non-critical observability gaps", () => {
    const result = sealTruthLineageCertificationGate(baseInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.advancementState).toBe("LINEAGE_LAYER_CONDITIONAL");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when certification tries to become a control surface", () => {
    const result = sealTruthLineageCertificationGate(baseInput({
      executionRequested: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
