import { describe, expect, it } from "vitest";
import { sealDependencyObservability } from "@/services/recommendation-dependency";
import { sealImpactCertification } from "@/services/recommendation-impact";
import {
  buildDriftObservabilityRequest,
  createDriftObservabilityEvidencePath,
  sealDriftAnalysis,
  sealDriftObservability,
  sealRecommendationDriftFoundation,
  type DriftAnalysisInput,
  type DriftObservabilityInput,
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

describe("driftObservabilityLayer", () => {
  it("is deterministic and reproduces observability hashes", () => {
    const input = driftObservabilityInput();
    const first = sealDriftObservability(input);
    const second = sealDriftObservability(input);
    expect(first).toEqual(second);
    expect(first.result.observabilityHash).toHaveLength(64);
  }, 15000);

  it("keeps observability evidence ordering deterministic", () => {
    const input = driftObservabilityInput();
    const reversed = driftObservabilityInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDriftObservability(reversed)).toEqual(sealDriftObservability(input));
    expect(createDriftObservabilityEvidencePath(reversed)).toEqual(createDriftObservabilityEvidencePath(input));
  });

  it("surfaces LOW, MODERATE, HIGH, and CRITICAL severity visibility reproducibly", () => {
    const base = driftAnalysisInput();
    const low = lowSeverityAnalysis(base);
    const moderate = moderateSeverityAnalysis(base);
    const high = {
      foundation: base.foundation,
      analysis: sealDriftAnalysis(base),
    };
    const critical = criticalSeverityAnalysis(base);

    const lowSealed = sealDriftObservability(driftObservabilityInput(low));
    const moderateSealed = sealDriftObservability(driftObservabilityInput(moderate));
    const highSealed = sealDriftObservability(driftObservabilityInput(high));
    const criticalSealed = sealDriftObservability(driftObservabilityInput(critical));

    expect(lowSealed.result.driftSeverityVisible).toBe(true);
    expect(moderateSealed.result.driftSeverityVisible).toBe(true);
    expect(highSealed.result.driftSeverityVisible).toBe(true);
    expect(criticalSealed.result.driftSeverityVisible).toBe(true);
    expect(lowSealed.evidencePath.severityReferences.some((ref) => ref.endsWith(":LOW"))).toBe(true);
    expect(moderateSealed.evidencePath.severityReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(highSealed.evidencePath.severityReferences.some((ref) => ref.endsWith(":HIGH"))).toBe(true);
    expect(criticalSealed.evidencePath.severityReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("keeps propagation and conflict visibility reproducible", () => {
    const first = sealDriftObservability(driftObservabilityInput());
    const second = sealDriftObservability(driftObservabilityInput());
    expect(first.result.driftPropagationVisible).toBe(true);
    expect(first.validation.driftConflictsVisible).toBe(true);
    expect(first.evidencePath.propagationReferences).toEqual(second.evidencePath.propagationReferences);
    expect(first.evidencePath.conflictReferences).toEqual(second.evidencePath.conflictReferences);
  });

  it("keeps lineage and governance visibility reproducible while preserving authority boundaries", () => {
    const sealed = sealDriftObservability(driftObservabilityInput());
    const authorityExpanded = sealDriftObservability(driftObservabilityInput({
      authorityExpansionDetected: true,
    }));
    expect(sealed.result.driftLineageVisible).toBe(true);
    expect(sealed.result.driftGovernanceVisible).toBe(true);
    expect(sealed.validation.authorityBounded).toBe(true);
    expect(authorityExpanded.result.observabilityState).toBe("INVALID");
    expect(authorityExpanded.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("keeps replay visibility reproducible and surfaces replay degradation", () => {
    const base = driftObservabilityInput();
    const visible = sealDriftObservability(base);
    const degraded = sealDriftObservability({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          replayReferences: Object.freeze([]),
        },
      },
    });
    expect(visible.result.driftReplayVisible).toBe(true);
    expect(degraded.result.observabilityState).toBe("LIMITED");
    expect(degraded.result.driftReplayVisible).toBe(false);
    expect(degraded.validation.reasonCodes).toContain("DRIFT_REPLAY_VISIBILITY_MISSING");
  });

  it("moves to OBSERVE when visibility evidence is incomplete", () => {
    const base = driftObservabilityInput();
    const observe = sealDriftObservability({
      ...base,
      analysis: {
        ...base.analysis,
        evidencePath: {
          ...base.analysis.evidencePath,
          severityReferences: Object.freeze([]),
        },
      },
    });
    expect(observe.result.observabilityState).toBe("OBSERVE");
    expect(observe.validation.reasonCodes).toContain("VISIBILITY_EVIDENCE_MISSING");
  });

  it("blocks cross-tenant visibility and ownership mismatch", () => {
    const base = driftObservabilityInput();
    const crossTenant = sealDriftObservability({
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
    const ownershipMismatch = sealDriftObservability({
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
    expect(crossTenant.result.observabilityState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_VISIBILITY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, mutation, prioritization, approval, repair, and workflow routing", () => {
    const base = driftObservabilityInput();
    expect(sealDriftObservability({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDriftObservability({ ...base, observabilityMutationAttempted: true }).validation.reasonCodes).toContain("OBSERVABILITY_MUTATION_DETECTED");
    expect(sealDriftObservability({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDriftObservability({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDriftObservability({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealDriftObservability({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
  });

  it("bounds observability counts at the declared limits", () => {
    const base = driftObservabilityInput();
    const propagationReferences = Object.freeze(Array.from(
      { length: 25_001 },
      (_, index) => `propagation:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const limited = sealDriftObservability({
      ...base,
      analysis: {
        ...base.analysis,
        evidencePath: {
          ...base.analysis.evidencePath,
          propagationReferences,
        },
        result: {
          ...base.analysis.result,
          propagationPathsDetected: propagationReferences.length,
        },
      },
    });
    expect(limited.result.observabilityState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  });
});
