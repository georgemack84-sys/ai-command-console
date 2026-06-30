import { describe, expect, it } from "vitest";
import { sealDependencyObservability } from "@/services/recommendation-dependency";
import { sealImpactCertification } from "@/services/recommendation-impact";
import {
  buildDriftObservabilityRequest,
  buildDriftReplayRequest,
  createDriftReplayEvidencePath,
  sealDriftAnalysis,
  sealDriftObservability,
  sealDriftReplay,
  sealRecommendationDriftFoundation,
  type DriftAnalysisInput,
  type DriftObservabilityInput,
  type DriftReplayInput,
  type RecommendationDriftFoundationInput,
} from "@/services/recommendation-drift";
import { sealPortfolioObservability } from "@/services/recommendation-portfolio";
import {
  alignedPortfolioInput,
  dependencyObservabilityInput,
  driftAnalysisInput,
  driftFoundationInput,
  impactCertificationInput,
  portfolioObservabilityInput,
} from "./recommendationDriftFixtures";

function foundationForScope(
  scope: RecommendationDriftFoundationInput["request"]["driftScope"],
  currentRecommendations: RecommendationDriftFoundationInput["currentRecommendations"],
) {
  return sealRecommendationDriftFoundation({
    ...driftFoundationInput(),
    request: { ...driftFoundationInput().request, driftScope: scope },
    currentRecommendations,
  });
}

function lowSeverityAnalysis(base: DriftAnalysisInput) {
  const foundation = foundationForScope(
    "EVIDENCE",
    Object.freeze([
      {
        ...driftFoundationInput().currentRecommendations[0],
        ledger: {
          ...driftFoundationInput().currentRecommendations[0].ledger,
          entry: {
            ...driftFoundationInput().currentRecommendations[0].ledger.entry,
            evidenceIds: Object.freeze(["evidence:low"]),
          },
        },
      },
      driftFoundationInput().currentRecommendations[1],
    ]),
  );
  return {
    foundation,
    analysis: sealDriftAnalysis({ ...base, foundation }),
  };
}

function moderateSeverityAnalysis(base: DriftAnalysisInput) {
  const foundation = foundationForScope(
    "REPLAY",
    Object.freeze([
      {
        ...driftFoundationInput().currentRecommendations[0],
        replayEvidence: {
          ...driftFoundationInput().currentRecommendations[0].replayEvidence,
          replayReferences: Object.freeze(["replay:moderate"]),
        },
      },
      driftFoundationInput().currentRecommendations[1],
    ]),
  );
  return {
    foundation,
    analysis: sealDriftAnalysis({ ...base, foundation }),
  };
}

function criticalSeverityAnalysis(base: DriftAnalysisInput) {
  const foundation = foundationForScope(
    "GOVERNANCE",
    Object.freeze([
      {
        ...driftFoundationInput().currentRecommendations[0],
        governanceCertification: {
          ...driftFoundationInput().currentRecommendations[0].governanceCertification,
          result: {
            ...driftFoundationInput().currentRecommendations[0].governanceCertification.result,
            certificationHash: "c".repeat(64),
          },
        },
        governanceReferences: {
          ...driftFoundationInput().currentRecommendations[0].governanceReferences,
          governanceReferences: Object.freeze(["gov:critical"]),
        },
      },
      driftFoundationInput().currentRecommendations[1],
    ]),
  );
  return {
    foundation,
    analysis: sealDriftAnalysis({
      ...base,
      foundation,
      impactCertification: {
        ...base.impactCertification,
        result: {
          ...base.impactCertification.result,
          governanceCertified: false,
        },
      },
    }),
  };
}

function driftObservabilityInput(overrides: Partial<DriftObservabilityInput> = {}): DriftObservabilityInput {
  const source = alignedPortfolioInput();
  const analysisInput = driftAnalysisInput();
  const impactInput = impactCertificationInput();
  return Object.freeze({
    request: buildDriftObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: analysisInput.foundation,
    analysis: sealDriftAnalysis(analysisInput),
    impactFoundation: impactInput.foundation,
    impactAnalysis: impactInput.analysis,
    impactObservability: impactInput.observability,
    impactReplay: impactInput.replay,
    impactCertification: sealImpactCertification(impactInput),
    dependencyFoundation: analysisInput.dependencyFoundation,
    dependencyAnalysis: analysisInput.dependencyAnalysis,
    dependencyObservability: sealDependencyObservability(dependencyObservabilityInput(source)),
    dependencyReplay: analysisInput.dependencyReplay,
    dependencyCertification: analysisInput.dependencyCertification,
    portfolio: analysisInput.portfolio,
    relationshipAnalysis: analysisInput.relationshipAnalysis,
    portfolioObservability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    portfolioReplay: analysisInput.portfolioReplay,
    portfolioCertification: analysisInput.portfolioCertification,
    recommendations: analysisInput.recommendations,
    ...overrides,
  } satisfies DriftObservabilityInput);
}

function driftReplayInput(overrides: Partial<DriftReplayInput> = {}): DriftReplayInput {
  const observabilityInput = driftObservabilityInput();
  const impactInput = impactCertificationInput();
  return Object.freeze({
    request: buildDriftReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "drift-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation: observabilityInput.foundation,
    analysis: observabilityInput.analysis,
    observability: sealDriftObservability(observabilityInput),
    impactFoundation: impactInput.foundation,
    impactAnalysis: impactInput.analysis,
    impactObservability: impactInput.observability,
    impactReplay: impactInput.replay,
    impactCertification: sealImpactCertification(impactInput),
    dependencyFoundation: observabilityInput.dependencyFoundation,
    dependencyAnalysis: observabilityInput.dependencyAnalysis,
    dependencyObservability: observabilityInput.dependencyObservability,
    dependencyReplay: observabilityInput.dependencyReplay,
    dependencyCertification: observabilityInput.dependencyCertification,
    portfolio: observabilityInput.portfolio,
    relationshipAnalysis: observabilityInput.relationshipAnalysis,
    portfolioObservability: observabilityInput.portfolioObservability,
    portfolioReplay: observabilityInput.portfolioReplay,
    portfolioCertification: observabilityInput.portfolioCertification,
    recommendations: observabilityInput.recommendations,
    ...overrides,
  } satisfies DriftReplayInput);
}

describe("driftReplayFramework", () => {
  it("reconstructs drift deterministically with stable hashes", () => {
    const input = driftReplayInput();
    const first = sealDriftReplay(input);
    const second = sealDriftReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  }, 15000);

  it("keeps replay evidence ordering deterministic", () => {
    const input = driftReplayInput();
    const reversed = driftReplayInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDriftReplay(reversed)).toEqual(sealDriftReplay(input));
    expect(createDriftReplayEvidencePath(reversed)).toEqual(createDriftReplayEvidencePath(input));
  });

  it("reconstructs LOW, MODERATE, HIGH, and CRITICAL severities reproducibly", () => {
    const base = driftAnalysisInput();
    const low = lowSeverityAnalysis(base);
    const moderate = moderateSeverityAnalysis(base);
    const critical = criticalSeverityAnalysis(base);

    const lowReplay = sealDriftReplay(driftReplayInput({
      foundation: low.foundation,
      analysis: low.analysis,
      observability: sealDriftObservability(driftObservabilityInput(low)),
    }));
    const moderateReplay = sealDriftReplay(driftReplayInput({
      foundation: moderate.foundation,
      analysis: moderate.analysis,
      observability: sealDriftObservability(driftObservabilityInput(moderate)),
    }));
    const highReplay = sealDriftReplay(driftReplayInput());
    const criticalReplay = sealDriftReplay(driftReplayInput({
      foundation: critical.foundation,
      analysis: critical.analysis,
      observability: sealDriftObservability(driftObservabilityInput(critical)),
    }));

    expect(lowReplay.result.severityReconstructed).toBe(true);
    expect(moderateReplay.result.severityReconstructed).toBe(true);
    expect(highReplay.result.severityReconstructed).toBe(true);
    expect(criticalReplay.result.severityReconstructed).toBe(true);
    expect(lowReplay.evidencePath.severityReferences.some((ref) => ref.endsWith(":LOW"))).toBe(true);
    expect(moderateReplay.evidencePath.severityReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(highReplay.evidencePath.severityReferences.some((ref) => ref.endsWith(":HIGH"))).toBe(true);
    expect(criticalReplay.evidencePath.severityReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("reconstructs propagation and conflicts reproducibly", () => {
    const first = sealDriftReplay(driftReplayInput());
    const second = sealDriftReplay(driftReplayInput());
    expect(first.result.propagationReconstructed).toBe(true);
    expect(first.result.conflictsReconstructed).toBe(true);
    expect(first.evidencePath.propagationReferences).toEqual(second.evidencePath.propagationReferences);
    expect(first.evidencePath.conflictReferences).toEqual(second.evidencePath.conflictReferences);
  });

  it("reconstructs governance while preserving authority scope", () => {
    const sealed = sealDriftReplay(driftReplayInput());
    expect(sealed.result.governanceReconstructed).toBe(true);
    expect(sealed.validation.authorityBounded).toBe(true);
  });

  it("surfaces replay mismatches and propagation mismatches as ESCALATED", () => {
    const base = driftReplayInput();
    const replayMismatch = sealDriftReplay({
      ...base,
      impactReplay: {
        ...base.impactReplay,
        result: {
          ...base.impactReplay.result,
          replayState: "ESCALATED",
        },
      },
    });
    const propagationMismatch = sealDriftReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          propagationReferences: Object.freeze([]),
        },
      },
    });
    expect(replayMismatch.result.replayState).toBe("ESCALATED");
    expect(replayMismatch.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
    expect(propagationMismatch.result.replayState).toBe("ESCALATED");
    expect(propagationMismatch.validation.reasonCodes).toContain("PROPAGATION_MISMATCH_DETECTED");
  });

  it("surfaces replay artifact degradation as LIMITED", () => {
    const base = driftReplayInput();
    const limited = sealDriftReplay({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          replayReferences: Object.freeze([]),
        },
      },
    });
    expect(limited.result.replayState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_ARTIFACTS_MISSING");
  });

  it("blocks cross-tenant replay and ownership mismatch", () => {
    const base = driftReplayInput();
    const crossTenant = sealDriftReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: {
            ...base.recommendations[0].replayEvidence,
            tenantId: "tenant-beta",
          },
        },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealDriftReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: {
            ...base.recommendations[0].ownershipEvidence,
            recommendationId: "recommendation-other",
          },
        },
        base.recommendations[1],
      ]),
    });
    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_REPLAY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, mutation, prioritization, approval, repair, workflow routing, and authority expansion", () => {
    const base = driftReplayInput();
    expect(sealDriftReplay({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDriftReplay({ ...base, replayMutationAttempted: true }).validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
    expect(sealDriftReplay({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDriftReplay({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDriftReplay({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealDriftReplay({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDriftReplay({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds replay counts at the declared limits", () => {
    const base = driftReplayInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `replay:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const limited = sealDriftReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          replayReferences: overflow,
        },
      },
    });
    expect(limited.result.replayState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
  });
});
