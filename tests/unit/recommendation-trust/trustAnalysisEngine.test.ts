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
  buildTrustAnalysisRequest,
  createTrustAnalysisEvidencePath,
  sealRecommendationTrustFoundation,
  sealTrustAnalysis,
  type RecommendationTrustFoundationInput,
  type TrustAnalysisInput,
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

  return { foundation, analysis, observability, replay, certification, recommendations };
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

function analysisInput(
  overrides: Partial<TrustAnalysisInput> = {},
): TrustAnalysisInput {
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(trustInput());
  return Object.freeze({
    request: buildTrustAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    driftReplay: trustInput().driftReplay,
    driftCertification: trustInput().driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: trustInput().recommendations,
    ...overrides,
  } satisfies TrustAnalysisInput);
}

describe("trustAnalysisEngine", () => {
  it("is deterministic and produces a stable analysis hash", () => {
    const input = analysisInput();
    const first = sealTrustAnalysis(input);
    const second = sealTrustAnalysis(input);
    expect(first).toEqual(second);
    expect(first.result.analysisState).toBe("ANALYZED");
    expect(first.result.analysisHash).toHaveLength(64);
  });

  it("keeps analysis ordering deterministic", () => {
    const input = analysisInput({
      request: buildTrustAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([...analysisInput().recommendations].reverse()),
    });
    const sealed = sealTrustAnalysis(input);
    expect(sealed).toEqual(sealTrustAnalysis(input));
    expect(createTrustAnalysisEvidencePath(input, sealed.strengths, sealed.concentrations, sealed.propagations, sealed.gaps, sealed.conflicts)).toEqual(
      createTrustAnalysisEvidencePath(input, sealed.strengths, sealed.concentrations, sealed.propagations, sealed.gaps, sealed.conflicts),
    );
  });

  it("reconstructs VERY_STRONG, STRONG, MODERATE, WEAK, and CRITICAL trust strengths reproducibly", () => {
    const veryStrong = sealTrustAnalysis(analysisInput({ request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }) }));
    const strongFoundation = sealRecommendationTrustFoundation({
      ...trustInput(),
      request: buildRecommendationTrustFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha"], trustScope: "REPLAY", graphVersion: "decision-graph/v1" }),
      driftReplay: {
        ...trustInput().driftReplay,
        result: {
          ...trustInput().driftReplay.result,
          replayState: "LIMITED",
        },
      },
    });
    const strong = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
      foundation: strongFoundation,
      recommendations: trustInput().recommendations,
    }));
    const moderateRecommendations = Object.freeze([
      {
        ...trustInput().recommendations[0],
        observability: {
          ...trustInput().recommendations[0].observability,
          result: {
            ...trustInput().recommendations[0].observability.result,
            observabilityState: "LIMITED",
          },
        },
        readiness: {
          ...trustInput().recommendations[0].readiness,
          result: {
            ...trustInput().recommendations[0].readiness.result,
            readinessState: "CONDITIONALLY_READY",
          },
        },
      },
      trustInput().recommendations[1],
    ]);
    const moderateFoundation = sealRecommendationTrustFoundation({
      ...trustInput(),
      recommendations: moderateRecommendations,
    });
    const moderate = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
      foundation: moderateFoundation,
      recommendations: moderateRecommendations,
    }));
    const weakScenario = buildDriftScenario({
      foundation: driftedFoundation(),
      recommendations: cachedDriftedRecommendations,
    });
    const weakFoundation = sealRecommendationTrustFoundation({
      ...trustInput({
        driftFoundation: weakScenario.foundation,
        driftReplay: weakScenario.replay,
        driftCertification: weakScenario.certification,
        recommendations: weakScenario.recommendations,
      }),
      request: buildRecommendationTrustFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], trustScope: "DRIFT", graphVersion: "decision-graph/v1" }),
      driftFoundation: {
        ...weakScenario.foundation,
        evidencePath: {
          ...weakScenario.foundation.evidencePath,
          driftReferences: Object.freeze([]),
        },
      },
    });
    const weak = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
      foundation: weakFoundation,
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    const critical = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
      foundation: sealRecommendationTrustFoundation({
        ...trustInput(),
        recommendations: Object.freeze([
          {
            ...trustInput().recommendations[0],
            governanceCertification: {
              ...trustInput().recommendations[0].governanceCertification,
              result: {
                ...trustInput().recommendations[0].governanceCertification.result,
                certificationState: "FAIL",
              },
            },
          },
          trustInput().recommendations[1],
        ]),
      }),
      recommendations: Object.freeze([
        {
          ...trustInput().recommendations[0],
          governanceCertification: {
            ...trustInput().recommendations[0].governanceCertification,
            result: {
              ...trustInput().recommendations[0].governanceCertification.result,
              certificationState: "FAIL",
            },
          },
        },
        trustInput().recommendations[1],
      ]),
    }));

    expect(veryStrong.strengths.some((strength) => strength.trustClass === "VERY_STRONG")).toBe(true);
    expect(strong.strengths.some((strength) => strength.trustClass === "STRONG")).toBe(true);
    expect(moderate.strengths.some((strength) => strength.trustClass === "MODERATE")).toBe(true);
    expect(weak.strengths.some((strength) => strength.trustClass === "WEAK")).toBe(true);
    expect(critical.strengths.some((strength) => strength.trustClass === "CRITICAL")).toBe(true);
  });

  it("surfaces propagation, concentration, gaps, and conflicts reproducibly", () => {
    const weakScenario = buildDriftScenario({
      foundation: driftedFoundation(),
      recommendations: cachedDriftedRecommendations,
    });
    const foundation = sealRecommendationTrustFoundation({
      ...trustInput({
        driftFoundation: weakScenario.foundation,
        driftReplay: weakScenario.replay,
        driftCertification: weakScenario.certification,
        recommendations: weakScenario.recommendations,
      }),
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-beta", "recommendation-alpha"],
        trustScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      driftFoundation: {
        ...weakScenario.foundation,
        evidencePath: {
          ...weakScenario.foundation.evidencePath,
          driftReferences: Object.freeze([]),
        },
      },
    });
    const sealed = sealTrustAnalysis(analysisInput({
      foundation,
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    expect(sealed.result.trustPropagationsDetected).toBeGreaterThan(0);
    expect(sealed.result.trustConcentrationsDetected).toBeGreaterThan(0);
    expect(sealed.result.trustGapsDetected).toBeGreaterThan(0);
    expect(sealed.result.trustConflictsDetected).toBeGreaterThanOrEqual(0);
  });

  it("enters OBSERVE when trust evidence is insufficient", () => {
    const base = analysisInput();
    const observe = sealTrustAnalysis({
      ...base,
      foundation: {
        ...base.foundation,
        result: {
          ...base.foundation.result,
          trustState: "UNKNOWN",
        },
        evidencePath: {
          ...base.foundation.evidencePath,
          trustReferences: Object.freeze([]),
        },
      },
    });
    expect(observe.result.analysisState).toBe("OBSERVE");
    expect(observe.validation.reasonCodes).toContain("TRUST_EVIDENCE_MISSING");
  });

  it("enters LIMITED when trust gaps or conflicts are present", () => {
    const limitedRecommendations = Object.freeze([
      {
        ...trustInput().recommendations[0],
        observability: {
          ...trustInput().recommendations[0].observability,
          result: {
            ...trustInput().recommendations[0].observability.result,
            observabilityState: "LIMITED",
          },
        },
        readiness: {
          ...trustInput().recommendations[0].readiness,
          result: {
            ...trustInput().recommendations[0].readiness.result,
            readinessState: "CONDITIONALLY_READY",
          },
        },
      },
      trustInput().recommendations[1],
    ]);
    const limitedFoundation = sealRecommendationTrustFoundation({
      ...trustInput(),
      recommendations: limitedRecommendations,
    });
    const limited = sealTrustAnalysis(analysisInput({
      foundation: limitedFoundation,
      recommendations: limitedRecommendations,
    }));
    expect(limited.result.analysisState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("TRUST_CONFLICTS_DETECTED");
  });

  it("blocks cross-tenant trust, ownership mismatches, execution requests, mutation attempts, ranking, prioritization, approval, and authority expansion", () => {
    const base = analysisInput();
    const crossTenant = sealTrustAnalysis({
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
    const ownershipMismatch = sealTrustAnalysis({
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
    expect(crossTenant.result.analysisState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_TRUST_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealTrustAnalysis({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTrustAnalysis({ ...base, analysisMutationAttempted: true }).validation.reasonCodes).toContain("ANALYSIS_MUTATION_DETECTED");
    expect(sealTrustAnalysis({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTrustAnalysis({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTrustAnalysis({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTrustAnalysis({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
