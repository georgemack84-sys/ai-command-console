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
  buildTrustObservabilityRequest,
  createTrustObservabilityEvidencePath,
  sealRecommendationTrustFoundation,
  sealTrustAnalysis,
  sealTrustObservability,
  type RecommendationTrustFoundationInput,
  type TrustAnalysisInput,
  type TrustObservabilityInput,
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

function trustInput(overrides: Partial<RecommendationTrustFoundationInput> = {}): RecommendationTrustFoundationInput {
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

function analysisInput(overrides: Partial<TrustAnalysisInput> = {}): TrustAnalysisInput {
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

function observabilityInput(overrides: Partial<TrustObservabilityInput> = {}): TrustObservabilityInput {
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(trustInput());
  const analysis = overrides.analysis ?? sealTrustAnalysis(analysisInput({ foundation, recommendations: overrides.recommendations ?? trustInput().recommendations }));
  return Object.freeze({
    request: buildTrustObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    driftReplay: trustInput().driftReplay,
    driftCertification: trustInput().driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: trustInput().recommendations,
    ...overrides,
  } satisfies TrustObservabilityInput);
}

describe("trustObservabilityLayer", () => {
  it("is deterministic and produces a stable observability hash", () => {
    const input = observabilityInput();
    const first = sealTrustObservability(input);
    const second = sealTrustObservability(input);
    expect(first).toEqual(second);
    expect(first.result.observabilityState).toBe("VISIBLE");
    expect(first.result.observabilityHash).toHaveLength(64);
  });

  it("keeps visibility ordering deterministic", () => {
    const input = observabilityInput({
      request: buildTrustObservabilityRequest({
        tenantId: "tenant-alpha",
        observabilityScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([...observabilityInput().recommendations].reverse()),
    });
    const sealed = sealTrustObservability(input);
    expect(sealed).toEqual(sealTrustObservability(input));
    expect(createTrustObservabilityEvidencePath(input)).toEqual(createTrustObservabilityEvidencePath(input));
  });

  it("makes VERY_STRONG, STRONG, MODERATE, WEAK, and CRITICAL strength visibility reproducible", () => {
    const veryStrong = sealTrustObservability(observabilityInput({
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
      })),
    }));
    const strongFoundation = sealRecommendationTrustFoundation({
      ...trustInput(),
      request: buildRecommendationTrustFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha"], trustScope: "REPLAY", graphVersion: "decision-graph/v1" }),
      driftReplay: {
        ...trustInput().driftReplay,
        result: { ...trustInput().driftReplay.result, replayState: "LIMITED" },
      },
    });
    const strong = sealTrustObservability(observabilityInput({
      foundation: strongFoundation,
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
        foundation: strongFoundation,
      })),
    }));
    const moderateRecommendations = Object.freeze([
      {
        ...trustInput().recommendations[0],
        observability: {
          ...trustInput().recommendations[0].observability,
          result: { ...trustInput().recommendations[0].observability.result, observabilityState: "LIMITED" },
        },
        readiness: {
          ...trustInput().recommendations[0].readiness,
          result: { ...trustInput().recommendations[0].readiness.result, readinessState: "CONDITIONALLY_READY" },
        },
      },
      trustInput().recommendations[1],
    ]);
    const moderateFoundation = sealRecommendationTrustFoundation({ ...trustInput(), recommendations: moderateRecommendations });
    const moderate = sealTrustObservability(observabilityInput({
      foundation: moderateFoundation,
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
        foundation: moderateFoundation,
        recommendations: moderateRecommendations,
      })),
      recommendations: moderateRecommendations,
    }));
    const weakScenario = buildDriftScenario({ foundation: driftedFoundation(), recommendations: cachedDriftedRecommendations });
    const weakFoundation = sealRecommendationTrustFoundation({
      ...trustInput({ driftFoundation: weakScenario.foundation, driftReplay: weakScenario.replay, driftCertification: weakScenario.certification, recommendations: weakScenario.recommendations }),
      request: buildRecommendationTrustFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], trustScope: "DRIFT", graphVersion: "decision-graph/v1" }),
      driftFoundation: { ...weakScenario.foundation, evidencePath: { ...weakScenario.foundation.evidencePath, driftReferences: Object.freeze([]) } },
    });
    const weak = sealTrustObservability(observabilityInput({
      foundation: weakFoundation,
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
        foundation: weakFoundation,
        driftReplay: weakScenario.replay,
        driftCertification: weakScenario.certification,
        recommendations: weakScenario.recommendations,
      })),
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    const criticalRecommendations = Object.freeze([
      {
        ...trustInput().recommendations[0],
        governanceCertification: {
          ...trustInput().recommendations[0].governanceCertification,
          result: { ...trustInput().recommendations[0].governanceCertification.result, certificationState: "FAIL" },
        },
      },
      trustInput().recommendations[1],
    ]);
    const criticalFoundation = sealRecommendationTrustFoundation({ ...trustInput(), recommendations: criticalRecommendations });
    const critical = sealTrustObservability(observabilityInput({
      foundation: criticalFoundation,
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-alpha", "recommendation-beta"], analysisScope: "STRENGTH", graphVersion: "decision-graph/v1" }),
        foundation: criticalFoundation,
        recommendations: criticalRecommendations,
      })),
      recommendations: criticalRecommendations,
    }));

    expect(veryStrong.evidencePath.strengthReferences.some((ref) => ref.endsWith(":VERY_STRONG"))).toBe(true);
    expect(strong.evidencePath.strengthReferences.some((ref) => ref.endsWith(":STRONG"))).toBe(true);
    expect(moderate.evidencePath.strengthReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(weak.evidencePath.strengthReferences.some((ref) => ref.endsWith(":WEAK"))).toBe(true);
    expect(critical.evidencePath.strengthReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("preserves propagation, lineage, governance, replay, and audit visibility reproducibly", () => {
    const sealed = sealTrustObservability(observabilityInput());
    expect(sealed.result.trustPropagationVisible).toBe(true);
    expect(sealed.result.trustLineageVisible).toBe(true);
    expect(sealed.result.trustGovernanceVisible).toBe(true);
    expect(sealed.result.trustReplayVisible).toBe(true);
    expect(sealed.result.trustAuditVisible).toBe(true);
    expect(sealed.evidencePath.auditReferences.length).toBeGreaterThan(0);
  });

  it("surfaces gap and conflict visibility reproducibly", () => {
    const weakScenario = buildDriftScenario({ foundation: driftedFoundation(), recommendations: cachedDriftedRecommendations });
    const foundation = sealRecommendationTrustFoundation({
      ...trustInput({ driftFoundation: weakScenario.foundation, driftReplay: weakScenario.replay, driftCertification: weakScenario.certification, recommendations: weakScenario.recommendations }),
      driftFoundation: { ...weakScenario.foundation, evidencePath: { ...weakScenario.foundation.evidencePath, driftReferences: Object.freeze([]) } },
    });
    const analysis = sealTrustAnalysis(analysisInput({
      foundation,
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    const sealed = sealTrustObservability(observabilityInput({
      foundation,
      analysis,
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    expect(sealed.evidencePath.gapReferences.length).toBeGreaterThan(0);
    expect(sealed.evidencePath.conflictReferences.length).toBeGreaterThanOrEqual(0);
  });

  it("enters OBSERVE when visibility evidence is incomplete", () => {
    const base = observabilityInput();
    const observe = sealTrustObservability({
      ...base,
      analysis: {
        ...base.analysis,
        strengths: Object.freeze([]),
        evidencePath: {
          ...base.analysis.evidencePath,
          strengthReferences: Object.freeze([]),
        },
      },
    });
    expect(observe.result.observabilityState).toBe("OBSERVE");
    expect(observe.validation.reasonCodes).toContain("VISIBILITY_EVIDENCE_MISSING");
  });

  it("enters LIMITED when replay or governance visibility is degraded", () => {
    const base = observabilityInput();
    const limited = sealTrustObservability({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          replayReferences: Object.freeze([]),
        },
      },
    });
    expect(limited.result.observabilityState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("TRUST_REPLAY_VISIBILITY_MISSING");
  });

  it("blocks cross-tenant visibility, ownership mismatches, execution requests, mutation attempts, ranking, prioritization, approval, and authority expansion", () => {
    const base = observabilityInput();
    const crossTenant = sealTrustObservability({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealTrustObservability({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
        base.recommendations[1],
      ]),
    });
    expect(crossTenant.result.observabilityState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_VISIBILITY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealTrustObservability({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTrustObservability({ ...base, observabilityMutationAttempted: true }).validation.reasonCodes).toContain("OBSERVABILITY_MUTATION_DETECTED");
    expect(sealTrustObservability({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTrustObservability({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTrustObservability({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTrustObservability({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
