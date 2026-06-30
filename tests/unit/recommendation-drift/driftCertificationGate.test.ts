import { describe, expect, it } from "vitest";
import {
  sealDependencyCertification,
  sealDependencyObservability,
} from "@/services/recommendation-dependency";
import { sealImpactCertification } from "@/services/recommendation-impact";
import {
  buildDriftCertificationRequest,
  buildDriftObservabilityRequest,
  buildDriftReplayRequest,
  createDriftCertificationEvidencePath,
  sealDriftAnalysis,
  sealDriftCertification,
  sealDriftObservability,
  sealDriftReplay,
  sealRecommendationDriftFoundation,
  type DriftAnalysisInput,
  type DriftCertificationInput,
  type DriftObservabilityInput,
  type DriftReplayInput,
  type RecommendationDriftFoundationInput,
} from "@/services/recommendation-drift";
import {
  sealPortfolioCertification,
  sealPortfolioObservability,
} from "@/services/recommendation-portfolio";
import {
  alignedPortfolioInput,
  dependencyCertificationInput,
  dependencyObservabilityInput,
  driftAnalysisInput,
  driftFoundationInput,
  impactCertificationInput,
  portfolioCertificationInput,
  portfolioObservabilityInput,
} from "./recommendationDriftFixtures";

const cachedSource = alignedPortfolioInput();
const cachedAnalysisInput = driftAnalysisInput();
const cachedImpactInput = impactCertificationInput();
const cachedDependencyObservability = sealDependencyObservability(dependencyObservabilityInput(cachedSource));
const cachedDependencyCertification = sealDependencyCertification(dependencyCertificationInput(cachedSource));
const cachedPortfolioObservability = sealPortfolioObservability(portfolioObservabilityInput(cachedSource));
const cachedPortfolioCertification = sealPortfolioCertification(portfolioCertificationInput(cachedSource));

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
  const recommendations = Object.freeze([
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
  ]);
  const foundation = foundationForScope(
    "EVIDENCE",
    recommendations,
  );
  return {
    foundation,
    analysis: sealDriftAnalysis({ ...base, foundation }),
    recommendations,
  };
}

function moderateSeverityAnalysis(base: DriftAnalysisInput) {
  const recommendations = Object.freeze([
    {
      ...driftFoundationInput().currentRecommendations[0],
      replayEvidence: {
        ...driftFoundationInput().currentRecommendations[0].replayEvidence,
        replayReferences: Object.freeze(["replay:moderate"]),
      },
    },
    driftFoundationInput().currentRecommendations[1],
  ]);
  const foundation = foundationForScope(
    "REPLAY",
    recommendations,
  );
  return {
    foundation,
    analysis: sealDriftAnalysis({ ...base, foundation }),
    recommendations,
  };
}

function criticalSeverityAnalysis(base: DriftAnalysisInput) {
  const recommendations = Object.freeze([
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
  ]);
  const foundation = foundationForScope(
    "GOVERNANCE",
    recommendations,
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
    recommendations,
  };
}

function driftObservabilityInput(
  overrides: Partial<DriftObservabilityInput> = {},
): DriftObservabilityInput {
  return Object.freeze({
    request: buildDriftObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: cachedAnalysisInput.foundation,
    analysis: sealDriftAnalysis(cachedAnalysisInput),
    impactFoundation: cachedImpactInput.foundation,
    impactAnalysis: cachedImpactInput.analysis,
    impactObservability: cachedImpactInput.observability,
    impactReplay: cachedImpactInput.replay,
    impactCertification: sealImpactCertification(cachedImpactInput),
    dependencyFoundation: cachedAnalysisInput.dependencyFoundation,
    dependencyAnalysis: cachedAnalysisInput.dependencyAnalysis,
    dependencyObservability: cachedDependencyObservability,
    dependencyReplay: cachedAnalysisInput.dependencyReplay,
    dependencyCertification: cachedAnalysisInput.dependencyCertification,
    portfolio: cachedAnalysisInput.portfolio,
    relationshipAnalysis: cachedAnalysisInput.relationshipAnalysis,
    portfolioObservability: cachedPortfolioObservability,
    portfolioReplay: cachedAnalysisInput.portfolioReplay,
    portfolioCertification: cachedAnalysisInput.portfolioCertification,
    recommendations: cachedAnalysisInput.recommendations,
    ...overrides,
  } satisfies DriftObservabilityInput);
}

function driftReplayInput(overrides: Partial<DriftReplayInput> = {}): DriftReplayInput {
  const observabilityInput = driftObservabilityInput();
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
    impactFoundation: cachedImpactInput.foundation,
    impactAnalysis: cachedImpactInput.analysis,
    impactObservability: cachedImpactInput.observability,
    impactReplay: cachedImpactInput.replay,
    impactCertification: sealImpactCertification(cachedImpactInput),
    dependencyFoundation: observabilityInput.dependencyFoundation,
    dependencyAnalysis: observabilityInput.dependencyAnalysis,
    dependencyObservability: cachedDependencyObservability,
    dependencyReplay: observabilityInput.dependencyReplay,
    dependencyCertification: observabilityInput.dependencyCertification,
    portfolio: observabilityInput.portfolio,
    relationshipAnalysis: observabilityInput.relationshipAnalysis,
    portfolioObservability: cachedPortfolioObservability,
    portfolioReplay: observabilityInput.portfolioReplay,
    portfolioCertification: observabilityInput.portfolioCertification,
    recommendations: observabilityInput.recommendations,
    ...overrides,
  } satisfies DriftReplayInput);
}

function certificationScenario(
  scenario: Partial<Pick<DriftCertificationInput, "foundation" | "analysis">> = {},
): Pick<DriftCertificationInput, "foundation" | "analysis" | "observability" | "replay"> {
  const baseObservabilityInput = driftObservabilityInput({
    foundation: scenario.foundation ?? cachedAnalysisInput.foundation,
    analysis: scenario.analysis ?? sealDriftAnalysis(cachedAnalysisInput),
    impactCertification: sealImpactCertification(cachedImpactInput),
    dependencyObservability: cachedDependencyObservability,
    portfolioObservability: cachedPortfolioObservability,
  });
  const observability = sealDriftObservability(baseObservabilityInput);
  const replay = sealDriftReplay(driftReplayInput({
    foundation: baseObservabilityInput.foundation,
    analysis: baseObservabilityInput.analysis,
    observability,
    impactCertification: sealImpactCertification(cachedImpactInput),
    dependencyObservability: cachedDependencyObservability,
    portfolioObservability: cachedPortfolioObservability,
  }));
  return {
    foundation: baseObservabilityInput.foundation,
    analysis: baseObservabilityInput.analysis,
    observability,
    replay,
  };
}

function driftCertificationInput(
  overrides: Partial<DriftCertificationInput> = {},
): DriftCertificationInput {
  const scenario = certificationScenario({
    foundation: overrides.foundation,
    analysis: overrides.analysis,
  });
  return Object.freeze({
    request: buildDriftCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: scenario.foundation,
    analysis: scenario.analysis,
    observability: scenario.observability,
    replay: scenario.replay,
    impactCertification: sealImpactCertification(cachedImpactInput),
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? cachedAnalysisInput.recommendations,
    ...overrides,
  } satisfies DriftCertificationInput);
}

describe("driftCertificationGate", () => {
  it("certifies drift deterministically with stable hashes", () => {
    const input = driftCertificationInput();
    const first = sealDriftCertification(input);
    const second = sealDriftCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationHash).toHaveLength(64);
  }, 15000);

  it("keeps certification ordering deterministic", () => {
    const input = driftCertificationInput();
    const reversed = driftCertificationInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDriftCertification(reversed)).toEqual(sealDriftCertification(input));
    expect(createDriftCertificationEvidencePath(reversed)).toEqual(createDriftCertificationEvidencePath(input));
  });

  it("certifies LOW, MODERATE, HIGH, and CRITICAL severities reproducibly", () => {
    const base = driftAnalysisInput();
    const low = lowSeverityAnalysis(base);
    const moderate = moderateSeverityAnalysis(base);
    const critical = criticalSeverityAnalysis(base);

    const lowCertified = sealDriftCertification(driftCertificationInput(low));
    const moderateCertified = sealDriftCertification(driftCertificationInput(moderate));
    const highCertified = sealDriftCertification(driftCertificationInput());
    const criticalCertified = sealDriftCertification(driftCertificationInput(critical));

    expect(lowCertified.result.severityCertified).toBe(true);
    expect(moderateCertified.result.severityCertified).toBe(true);
    expect(highCertified.result.severityCertified).toBe(true);
    expect(criticalCertified.result.severityCertified).toBe(true);
    expect(lowCertified.evidencePath.severityReferences.some((ref) => ref.endsWith(":LOW"))).toBe(true);
    expect(moderateCertified.evidencePath.severityReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(highCertified.evidencePath.severityReferences.some((ref) => ref.endsWith(":HIGH"))).toBe(true);
    expect(criticalCertified.evidencePath.severityReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("certifies integrity, propagation, replay, governance, and observability", () => {
    const sealed = sealDriftCertification(driftCertificationInput());
    expect(sealed.result.certificationState).toBe("PASS");
    expect(sealed.result.integrityCertified).toBe(true);
    expect(sealed.result.propagationCertified).toBe(true);
    expect(sealed.result.replayCertified).toBe(true);
    expect(sealed.result.governanceCertified).toBe(true);
    expect(sealed.result.observabilityCertified).toBe(true);
  });

  it("surfaces replay degradation and observability incompleteness as CONDITIONAL_PASS", () => {
    const base = driftCertificationInput();
    const replayDegraded = sealDriftCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "LIMITED",
        },
      },
    });
    const observabilityIncomplete = sealDriftCertification({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          observabilityState: "LIMITED",
          driftReplayVisible: false,
        },
      },
    });
    expect(replayDegraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayDegraded.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityIncomplete.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityIncomplete.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
  });

  it("fails on cross-tenant certification, ownership mismatch, and replay corruption", () => {
    const base = driftCertificationInput();
    const crossTenant = sealDriftCertification({
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
    const ownershipMismatch = sealDriftCertification({
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
    const replayCorrupted = sealDriftCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "ESCALATED",
        },
      },
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(replayCorrupted.result.certificationState).toBe("FAIL");
    expect(replayCorrupted.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
  });

  it("blocks execution, mutation, prioritization, approval, repair, workflow routing, and authority expansion", () => {
    const base = driftCertificationInput();
    expect(sealDriftCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDriftCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealDriftCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDriftCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDriftCertification({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealDriftCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDriftCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds certification counts at the declared limits", () => {
    const base = driftCertificationInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const failed = sealDriftCertification({
      ...base,
      replay: {
        ...base.replay,
        evidencePath: {
          ...base.replay.evidencePath,
          lineageReferences: overflow,
        },
      },
    });
    expect(failed.result.certificationState).toBe("FAIL");
    expect(failed.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  });
});
