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
  buildRecommendationResilienceFoundationRequest,
  buildResilienceAnalysisRequest,
  createResilienceAnalysisEvidencePath,
  sealRecommendationResilienceFoundation,
  sealResilienceAnalysis,
  type RecommendationResilienceFoundationInput,
  type ResilienceAnalysisInput,
} from "@/services/recommendation-resilience";
import {
  buildRecommendationTrustFoundationRequest,
  buildTrustAnalysisRequest,
  buildTrustCertificationRequest,
  buildTrustObservabilityRequest,
  buildTrustReplayRequest,
  sealRecommendationTrustFoundation,
  sealTrustAnalysis,
  sealTrustCertification,
  sealTrustObservability,
  sealTrustReplay,
  type RecommendationTrustFoundationInput,
  type TrustAnalysisInput,
  type TrustCertificationInput,
  type TrustObservabilityInput,
  type TrustReplayInput,
} from "@/services/recommendation-trust";
import {
  alignedPortfolioInput,
  dependencyCertificationInput,
  dependencyObservabilityInput,
  driftAnalysisInput,
  driftFoundationInput,
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
  const recommendations = overrides.recommendations ?? cachedStableRecommendations;
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
    portfolioCertification: cachedPortfolioCertification,
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
    portfolioCertification: cachedPortfolioCertification,
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

function trustAnalysisInput(overrides: Partial<TrustAnalysisInput> = {}): TrustAnalysisInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  return Object.freeze({
    request: buildTrustAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies TrustAnalysisInput);
}

function trustObservabilityInput(overrides: Partial<TrustObservabilityInput> = {}): TrustObservabilityInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(trustAnalysisInput({
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  return Object.freeze({
    request: buildTrustObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies TrustObservabilityInput);
}

function trustReplayInput(overrides: Partial<TrustReplayInput> = {}): TrustReplayInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(trustAnalysisInput({
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const observability = overrides.observability ?? sealTrustObservability(trustObservabilityInput({
    foundation,
    analysis,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  return Object.freeze({
    request: buildTrustReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "trust-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies TrustReplayInput);
}

function trustCertificationInput(overrides: Partial<TrustCertificationInput> = {}): TrustCertificationInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(trustAnalysisInput({
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const observability = overrides.observability ?? sealTrustObservability(trustObservabilityInput({
    foundation,
    analysis,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const replay = overrides.replay ?? sealTrustReplay(trustReplayInput({
    foundation,
    analysis,
    observability,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  return Object.freeze({
    request: buildTrustCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    replay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies TrustCertificationInput);
}

function replayableTrustReplay(input: TrustCertificationInput["replay"]) {
  return {
    ...input,
    result: {
      ...input.result,
      replayState: "REPLAYABLE" as const,
      propagationReconstructed: true,
    },
    validation: {
      ...input.validation,
      propagationReconstructed: true,
    },
  };
}

function resilienceFoundationInput(overrides: Partial<RecommendationResilienceFoundationInput> = {}): RecommendationResilienceFoundationInput {
  const drift = buildDriftScenario();
  const trustFoundation = overrides.trustFoundation ?? sealRecommendationTrustFoundation(trustInput({
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const analysis = sealTrustAnalysis(trustAnalysisInput({
    foundation: trustFoundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const observability = sealTrustObservability(trustObservabilityInput({
    foundation: trustFoundation,
    analysis,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const trustReplay = overrides.trustReplay ?? replayableTrustReplay(sealTrustReplay(trustReplayInput({
    foundation: trustFoundation,
    analysis,
    observability,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  })));
  const trustCertification = overrides.trustCertification ?? sealTrustCertification(trustCertificationInput({
    foundation: trustFoundation,
    analysis,
    observability,
    replay: trustReplay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  return Object.freeze({
    request: buildRecommendationResilienceFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      resilienceScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    trustFoundation,
    trustReplay,
    trustCertification,
    driftFoundation: overrides.driftFoundation ?? drift.foundation,
    driftReplay: overrides.driftReplay ?? drift.replay,
    driftCertification: overrides.driftCertification ?? drift.certification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? drift.recommendations,
    ...overrides,
  } satisfies RecommendationResilienceFoundationInput);
}

function resilienceAnalysisInput(overrides: Partial<ResilienceAnalysisInput> = {}): ResilienceAnalysisInput {
  const base = resilienceFoundationInput();
  const foundation = overrides.foundation ?? sealRecommendationResilienceFoundation(base);
  return Object.freeze({
    request: buildResilienceAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies ResilienceAnalysisInput);
}

function withResilienceStates(
  foundation: ReturnType<typeof sealRecommendationResilienceFoundation>,
  state: "RESILIENT" | "CONDITIONALLY_RESILIENT" | "DEGRADED" | "FRAGILE" | "UNKNOWN",
) {
  return {
    ...foundation,
    result: {
      ...foundation.result,
      resilienceState: state,
    },
    resiliences: Object.freeze(foundation.resiliences.map((resilience) => ({
      ...resilience,
      resilienceState: state,
    }))),
  };
}

function patchResilienceState(
  foundation: ReturnType<typeof sealRecommendationResilienceFoundation>,
  recommendationIdValue: string,
  dimension: string,
  state: "RESILIENT" | "CONDITIONALLY_RESILIENT" | "DEGRADED" | "FRAGILE" | "UNKNOWN",
  overallState: ReturnType<typeof sealRecommendationResilienceFoundation>["result"]["resilienceState"] = foundation.result.resilienceState,
) {
  return {
    ...foundation,
    result: {
      ...foundation.result,
      resilienceState: overallState,
    },
    resiliences: Object.freeze(foundation.resiliences.map((resilience) => (
      resilience.recommendationId === recommendationIdValue && resilience.resilienceDimension === dimension
        ? { ...resilience, resilienceState: state }
        : resilience
    ))),
  };
}

describe("resilienceAnalysisEngine", () => {
  it("is deterministic and produces a stable analysis hash", () => {
    const input = resilienceAnalysisInput();
    const first = sealResilienceAnalysis(input);
    const second = sealResilienceAnalysis(input);
    expect(first).toEqual(second);
    expect(first.result.analysisState).toBe("ANALYZED");
    expect(first.result.analysisHash).toHaveLength(64);
  });

  it("keeps analysis ordering deterministic", () => {
    const base = resilienceAnalysisInput();
    const input = resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([...base.recommendations].reverse()),
    });
    const sealed = sealResilienceAnalysis(input);
    expect(sealed).toEqual(sealResilienceAnalysis(input));
    expect(createResilienceAnalysisEvidencePath(input, sealed.strengths, sealed.concentrations, sealed.propagations, sealed.gaps, sealed.failures)).toEqual(
      createResilienceAnalysisEvidencePath(input, sealed.strengths, sealed.concentrations, sealed.propagations, sealed.gaps, sealed.failures),
    );
  });

  it("reconstructs VERY_RESILIENT, RESILIENT, MODERATELY_RESILIENT, WEAK, and FRAGILE strengths reproducibly", () => {
    const base = sealRecommendationResilienceFoundation(resilienceFoundationInput());
    const veryResilient = sealResilienceAnalysis(resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: withResilienceStates(base, "RESILIENT"),
    }));
    const resilient = sealResilienceAnalysis(resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: patchResilienceState(
        withResilienceStates(base, "RESILIENT"),
        "recommendation-alpha",
        "EVIDENCE_RESILIENCE",
        "CONDITIONALLY_RESILIENT",
        "CONDITIONALLY_RESILIENT",
      ),
    }));
    const moderate = sealResilienceAnalysis(resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: patchResilienceState(
        withResilienceStates(base, "DEGRADED"),
        "recommendation-alpha",
        "REPLAY_RESILIENCE",
        "DEGRADED",
        "DEGRADED",
      ),
    }));
    const weak = sealResilienceAnalysis(resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: patchResilienceState(
        withResilienceStates(base, "UNKNOWN"),
        "recommendation-alpha",
        "TRUST_RESILIENCE",
        "UNKNOWN",
        "UNKNOWN",
      ),
    }));
    const fragile = sealResilienceAnalysis(resilienceAnalysisInput({
      request: buildResilienceAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: patchResilienceState(
        withResilienceStates(base, "FRAGILE"),
        "recommendation-alpha",
        "GOVERNANCE_RESILIENCE",
        "FRAGILE",
        "FRAGILE",
      ),
    }));

    expect(veryResilient.strengths.some((strength) => strength.resilienceClass === "VERY_RESILIENT")).toBe(true);
    expect(resilient.strengths.some((strength) => strength.resilienceClass === "RESILIENT")).toBe(true);
    expect(moderate.strengths.some((strength) => strength.resilienceClass === "MODERATELY_RESILIENT")).toBe(true);
    expect(weak.strengths.some((strength) => strength.resilienceClass === "WEAK")).toBe(true);
    expect(fragile.strengths.some((strength) => strength.resilienceClass === "FRAGILE")).toBe(true);
  });

  it("surfaces propagation, concentration, gaps, and failures reproducibly", () => {
    const base = sealRecommendationResilienceFoundation(resilienceFoundationInput());
    const foundation = {
      ...patchResilienceState(
        withResilienceStates(base, "DEGRADED"),
        "recommendation-alpha",
        "DEPENDENCY_RESILIENCE",
        "UNKNOWN",
        "DEGRADED",
      ),
      evidencePath: {
        ...base.evidencePath,
        resilienceReferences: Object.freeze(base.evidencePath.resilienceReferences),
      },
    };
    const sealed = sealResilienceAnalysis(resilienceAnalysisInput({ foundation }));
    expect(sealed.result.resiliencePropagationsDetected).toBeGreaterThan(0);
    expect(sealed.result.resilienceConcentrationsDetected).toBeGreaterThan(0);
    expect(sealed.result.resilienceGapsDetected).toBeGreaterThan(0);
    expect(sealed.result.resilienceFailuresDetected).toBeGreaterThan(0);
  });

  it("enters OBSERVE when resilience evidence is insufficient", () => {
    const base = resilienceAnalysisInput();
    const observe = sealResilienceAnalysis({
      ...base,
      foundation: {
        ...base.foundation,
        result: {
          ...base.foundation.result,
          resilienceState: "UNKNOWN",
        },
        evidencePath: {
          ...base.foundation.evidencePath,
          resilienceReferences: Object.freeze([]),
        },
      },
    });
    expect(observe.result.analysisState).toBe("OBSERVE");
    expect(observe.validation.reasonCodes).toContain("RESILIENCE_EVIDENCE_MISSING");
  });

  it("enters LIMITED when resilience gaps or failures are present", () => {
    const base = sealRecommendationResilienceFoundation(resilienceFoundationInput());
    const limited = sealResilienceAnalysis(resilienceAnalysisInput({
      foundation: patchResilienceState(
        withResilienceStates(base, "DEGRADED"),
        "recommendation-alpha",
        "DEPENDENCY_RESILIENCE",
        "UNKNOWN",
        "DEGRADED",
      ),
    }));
    expect(limited.result.analysisState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("RESILIENCE_GAPS_DETECTED");
  });

  it("blocks cross-tenant resilience, ownership mismatches, execution, mutation, ranking, prioritization, approval, repair, and authority expansion", () => {
    const base = resilienceAnalysisInput();
    const crossTenant = sealResilienceAnalysis({
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
    const ownershipMismatch = sealResilienceAnalysis({
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
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_RESILIENCE_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealResilienceAnalysis({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealResilienceAnalysis({ ...base, analysisMutationAttempted: true }).validation.reasonCodes).toContain("ANALYSIS_MUTATION_DETECTED");
    expect(sealResilienceAnalysis({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealResilienceAnalysis({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealResilienceAnalysis({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealResilienceAnalysis({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealResilienceAnalysis({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
