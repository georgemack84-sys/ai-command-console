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
  sealDriftAnalysis,
  sealDriftCertification,
  sealDriftObservability,
  sealDriftReplay,
  sealRecommendationDriftFoundation,
  type DriftAnalysisInput,
  type DriftCertificationInput,
  type DriftObservabilityInput,
  type DriftReplayInput,
} from "@/services/recommendation-drift";
import {
  sealPortfolioCertification,
  sealPortfolioObservability,
} from "@/services/recommendation-portfolio";
import {
  buildRecommendationTrustFoundationRequest,
  sealRecommendationTrustFoundation,
  type RecommendationTrustFoundationInput,
} from "@/services/recommendation-trust";
import {
  alignedPortfolioInput,
  dependencyCertificationInput,
  dependencyObservabilityInput,
  driftAnalysisInput,
  driftFoundationInput,
  driftedFoundation,
  impactCertificationInput,
  portfolioCertificationInput,
  portfolioObservabilityInput,
} from "../recommendation-drift/recommendationDriftFixtures";

const cachedSource = alignedPortfolioInput();
const cachedDriftAnalysisInput = driftAnalysisInput();
const cachedImpactInput = impactCertificationInput();
const cachedImpactCertification = sealImpactCertification(cachedImpactInput);
const cachedDependencyObservability = sealDependencyObservability(dependencyObservabilityInput(cachedSource));
const cachedDependencyCertification = sealDependencyCertification(dependencyCertificationInput(cachedSource));
const cachedPortfolioObservability = sealPortfolioObservability(portfolioObservabilityInput(cachedSource));
const cachedPortfolioCertification = sealPortfolioCertification(portfolioCertificationInput(cachedSource));
const cachedStableRecommendations = driftFoundationInput().currentRecommendations;
const cachedDriftedRecommendations = cachedDriftAnalysisInput.recommendations;

function buildDriftScenario(
  overrides: Partial<{
    foundation: ReturnType<typeof sealRecommendationDriftFoundation>;
    analysis: ReturnType<typeof sealDriftAnalysis>;
    observability: ReturnType<typeof sealDriftObservability>;
    replay: ReturnType<typeof sealDriftReplay>;
    certification: ReturnType<typeof sealDriftCertification>;
    recommendations: DriftAnalysisInput["recommendations"];
  }> = {},
) {
  const foundation = overrides.foundation ?? sealRecommendationDriftFoundation(driftFoundationInput());
  const recommendations = overrides.recommendations
    ?? (foundation.result.driftState === "STABLE" ? cachedStableRecommendations : cachedDriftedRecommendations);
  const analysis = overrides.analysis ?? sealDriftAnalysis({
    ...cachedDriftAnalysisInput,
    foundation,
    recommendations,
  });
  const observability = overrides.observability ?? sealDriftObservability({
    request: buildDriftObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    impactFoundation: cachedImpactInput.foundation,
    impactAnalysis: cachedImpactInput.analysis,
    impactObservability: cachedImpactInput.observability,
    impactReplay: cachedImpactInput.replay,
    impactCertification: cachedImpactCertification,
    dependencyFoundation: cachedDriftAnalysisInput.dependencyFoundation,
    dependencyAnalysis: cachedDriftAnalysisInput.dependencyAnalysis,
    dependencyObservability: cachedDependencyObservability,
    dependencyReplay: cachedDriftAnalysisInput.dependencyReplay,
    dependencyCertification: cachedDriftAnalysisInput.dependencyCertification,
    portfolio: cachedDriftAnalysisInput.portfolio,
    relationshipAnalysis: cachedDriftAnalysisInput.relationshipAnalysis,
    portfolioObservability: cachedPortfolioObservability,
    portfolioReplay: cachedDriftAnalysisInput.portfolioReplay,
    portfolioCertification: cachedDriftAnalysisInput.portfolioCertification,
    recommendations,
  } satisfies DriftObservabilityInput);
  const replay = overrides.replay ?? sealDriftReplay({
    request: buildDriftReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "drift-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    impactFoundation: cachedImpactInput.foundation,
    impactAnalysis: cachedImpactInput.analysis,
    impactObservability: cachedImpactInput.observability,
    impactReplay: cachedImpactInput.replay,
    impactCertification: cachedImpactCertification,
    dependencyFoundation: cachedDriftAnalysisInput.dependencyFoundation,
    dependencyAnalysis: cachedDriftAnalysisInput.dependencyAnalysis,
    dependencyObservability: cachedDependencyObservability,
    dependencyReplay: cachedDriftAnalysisInput.dependencyReplay,
    dependencyCertification: cachedDriftAnalysisInput.dependencyCertification,
    portfolio: cachedDriftAnalysisInput.portfolio,
    relationshipAnalysis: cachedDriftAnalysisInput.relationshipAnalysis,
    portfolioObservability: cachedPortfolioObservability,
    portfolioReplay: cachedDriftAnalysisInput.portfolioReplay,
    portfolioCertification: cachedDriftAnalysisInput.portfolioCertification,
    recommendations,
  } satisfies DriftReplayInput);
  const certification = overrides.certification ?? sealDriftCertification({
    request: buildDriftCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    replay,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations,
  } satisfies DriftCertificationInput);

  return {
    foundation,
    analysis,
    observability,
    replay,
    certification,
    recommendations,
  };
}

function trustInput(
  overrides: Partial<RecommendationTrustFoundationInput> = {},
): RecommendationTrustFoundationInput {
  const scenario = buildDriftScenario();
  return Object.freeze({
    request: buildRecommendationTrustFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      trustScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    driftFoundation: scenario.foundation,
    driftReplay: scenario.replay,
    driftCertification: scenario.certification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: scenario.recommendations,
    ...overrides,
  } satisfies RecommendationTrustFoundationInput);
}

describe("recommendationTrustFoundation", () => {
  it("is deterministic and produces a stable trust graph hash", () => {
    const input = trustInput();
    const first = sealRecommendationTrustFoundation(input);
    const second = sealRecommendationTrustFoundation(input);
    expect(first).toEqual(second);
    expect(first.result.trustState).toBe("TRUSTED");
    expect(first.result.trustGraphHash).toHaveLength(64);
    expect(first.result.trustRecordsCreated).toBe(18);
  });

  it("keeps trust ordering deterministic and scopes records correctly", () => {
    const input = trustInput({
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        trustScope: "EVIDENCE",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([...trustInput().recommendations].reverse()),
    });
    const sealed = sealRecommendationTrustFoundation(input);
    expect(sealed.result.trustState).toBe("TRUSTED");
    expect(sealed.result.trustRecordsCreated).toBe(2);
    expect(sealed.result.evidenceTrustDetected).toBe(2);
    expect(sealed.result.lineageTrustDetected).toBe(0);
    expect(sealed.result.driftTrustDetected).toBe(0);
  });

  it("surfaces conditional trust when bounded replay degradation is present", () => {
    const base = trustInput();
    const sealed = sealRecommendationTrustFoundation({
      ...base,
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha"],
        trustScope: "REPLAY",
        graphVersion: "decision-graph/v1",
      }),
      driftReplay: {
        ...base.driftReplay,
        result: {
          ...base.driftReplay.result,
          replayState: "LIMITED",
        },
      },
    });
    expect(sealed.result.trustState).toBe("CONDITIONALLY_TRUSTED");
    expect(sealed.validation.reasonCodes).toContain("REPLAY_TRUST_CONDITIONAL");
    expect(sealed.validation.reasonCodes).toContain("BOUNDED_DEGRADATION_DETECTED");
  });

  it("surfaces degraded trust when multiple bounded concerns accumulate", () => {
    const base = trustInput();
    const recommendations = Object.freeze(base.recommendations.map((bundle) => ({
      ...bundle,
      observability: {
        ...bundle.observability,
        result: {
          ...bundle.observability.result,
          observabilityState: "LIMITED",
        },
      },
    })));
    const scenario = buildDriftScenario({
      foundation: driftedFoundation(),
      recommendations,
    });
    const sealed = sealRecommendationTrustFoundation(trustInput({
      driftFoundation: scenario.foundation,
      driftReplay: scenario.replay,
      driftCertification: scenario.certification,
      recommendations,
    }));
    expect(sealed.result.trustState).toBe("DEGRADED");
    expect(sealed.validation.reasonCodes).toContain("MULTIPLE_TRUST_CONCERNS_DETECTED");
  });

  it("surfaces unknown trust when required trust evidence is missing", () => {
    const scenario = buildDriftScenario({
      foundation: driftedFoundation(),
      recommendations: cachedDriftedRecommendations,
    });
    const base = trustInput({
      driftFoundation: scenario.foundation,
      driftReplay: scenario.replay,
      driftCertification: scenario.certification,
      recommendations: scenario.recommendations,
    });
    const sealed = sealRecommendationTrustFoundation({
      ...base,
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-beta", "recommendation-alpha"],
        trustScope: "DRIFT",
        graphVersion: "decision-graph/v1",
      }),
      driftFoundation: {
        ...base.driftFoundation,
        evidencePath: {
          ...base.driftFoundation.evidencePath,
          driftReferences: Object.freeze([]),
        },
      },
    });
    expect(sealed.result.trustState).toBe("UNKNOWN");
    expect(sealed.validation.reasonCodes).toContain("DRIFT_TRUST_UNKNOWN");
  });

  it("blocks cross-tenant trust and ownership mismatches as untrusted", () => {
    const base = trustInput();
    const crossTenant = sealRecommendationTrustFoundation({
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
    const ownershipMismatch = sealRecommendationTrustFoundation({
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
    expect(crossTenant.result.trustState).toBe("UNTRUSTED");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_TRUST_BLOCKED");
    expect(ownershipMismatch.result.trustState).toBe("UNTRUSTED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution-authority expansion and trust mutation attempts", () => {
    const base = trustInput();
    expect(sealRecommendationTrustFoundation({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationTrustFoundation({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealRecommendationTrustFoundation({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealRecommendationTrustFoundation({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealRecommendationTrustFoundation({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealRecommendationTrustFoundation({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(sealRecommendationTrustFoundation({ ...base, trustMutationAttempted: true }).validation.reasonCodes).toContain("TRUST_MUTATION_DETECTED");
  });
});
