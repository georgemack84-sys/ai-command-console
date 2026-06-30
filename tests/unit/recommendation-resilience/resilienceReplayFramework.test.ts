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
  buildResilienceObservabilityRequest,
  buildResilienceReplayRequest,
  createResilienceReplayEvidencePath,
  sealRecommendationResilienceFoundation,
  sealResilienceAnalysis,
  sealResilienceObservability,
  sealResilienceReplay,
  type RecommendationResilienceFoundationInput,
  type ResilienceAnalysisInput,
  type ResilienceObservabilityInput,
  type ResilienceReplayInput,
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
  portfolioCertificationInput,
  portfolioObservabilityInput,
  impactCertificationInput,
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
  const trustReplay = overrides.trustReplay ?? sealTrustReplay(trustReplayInput({
    foundation: trustFoundation,
    analysis,
    observability,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
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

function resilienceObservabilityInput(overrides: Partial<ResilienceObservabilityInput> = {}): ResilienceObservabilityInput {
  const base = resilienceFoundationInput();
  const foundation = overrides.foundation ?? sealRecommendationResilienceFoundation(base);
  const analysis = overrides.analysis ?? sealResilienceAnalysis(resilienceAnalysisInput({
    foundation,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  return Object.freeze({
    request: buildResilienceObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies ResilienceObservabilityInput);
}

function withoutCorruptionReasons<T extends readonly string[]>(reasons: T): string[] {
  return reasons.filter((reason) => reason !== "GOVERNANCE_CORRUPTION_DETECTED" && reason !== "REPLAY_CORRUPTION_DETECTED");
}

function replayableInput(
  overrides: Partial<ResilienceReplayInput> = {},
): ResilienceReplayInput {
  const baseObservability = resilienceObservabilityInput();
  const normalizedDriftReplay = {
    ...baseObservability.driftReplay,
    result: {
      ...baseObservability.driftReplay.result,
      replayState: "REPLAYABLE" as const,
    },
  };
  const foundation = {
    ...baseObservability.foundation,
    result: {
      ...baseObservability.foundation.result,
      resilienceState: "RESILIENT" as const,
    },
    validation: {
      ...baseObservability.foundation.validation,
      reasonCodes: Object.freeze(withoutCorruptionReasons(baseObservability.foundation.validation.reasonCodes)),
    },
  };
  const analysis = {
    ...baseObservability.analysis,
    result: {
      ...baseObservability.analysis.result,
      analysisState: "ANALYZED" as const,
    },
    validation: {
      ...baseObservability.analysis.validation,
      reasonCodes: Object.freeze(withoutCorruptionReasons(baseObservability.analysis.validation.reasonCodes)),
    },
  };
  const observability = sealResilienceObservability({
    ...baseObservability,
    trustReplay: {
      ...baseObservability.trustReplay,
      result: {
        ...baseObservability.trustReplay.result,
        replayState: "REPLAYABLE",
      },
    },
    trustCertification: {
      ...baseObservability.trustCertification,
      result: {
        ...baseObservability.trustCertification.result,
        certificationState: "PASS",
      },
    },
    driftReplay: normalizedDriftReplay,
    foundation,
    analysis,
  });
  return Object.freeze({
    request: buildResilienceReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "resilience-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    trustReplay: {
      ...baseObservability.trustReplay,
      result: {
        ...baseObservability.trustReplay.result,
        replayState: "REPLAYABLE",
      },
    },
    trustCertification: {
      ...baseObservability.trustCertification,
      result: {
        ...baseObservability.trustCertification.result,
        certificationState: "PASS",
      },
    },
    driftReplay: normalizedDriftReplay,
    driftCertification: baseObservability.driftCertification,
    impactCertification: baseObservability.impactCertification,
    dependencyCertification: baseObservability.dependencyCertification,
    portfolioCertification: baseObservability.portfolioCertification,
    recommendations: baseObservability.recommendations,
    ...overrides,
  } satisfies ResilienceReplayInput);
}

describe("resilienceReplayFramework", () => {
  it("reconstructs resilience deterministically with stable hashes", () => {
    const input = replayableInput();
    const first = sealResilienceReplay(input);
    const second = sealResilienceReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayState).toBe("REPLAYABLE");
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps replay evidence ordering deterministic", () => {
    const input = replayableInput();
    const reversed = replayableInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealResilienceReplay(reversed)).toEqual(sealResilienceReplay(input));
    expect(createResilienceReplayEvidencePath(reversed)).toEqual(createResilienceReplayEvidencePath(input));
  });

  it("reconstructs VERY_RESILIENT, RESILIENT, MODERATELY_RESILIENT, WEAK, and FRAGILE strengths reproducibly", () => {
    const base = replayableInput();
    const replayed = sealResilienceReplay({
      ...base,
      request: buildResilienceReplayRequest({
        tenantId: "tenant-alpha",
        replayScope: "STRENGTH",
        replayVersion: "resilience-replay/v1",
        graphVersion: "decision-graph/v1",
      }),
    });
    expect(replayed.evidencePath.strengthReferences.some((ref) => ref.endsWith(":VERY_RESILIENT") || ref.endsWith(":RESILIENT") || ref.endsWith(":MODERATELY_RESILIENT") || ref.endsWith(":WEAK") || ref.endsWith(":FRAGILE"))).toBe(true);
  });

  it("reconstructs propagation, failures, governance, and observability reproducibly", () => {
    const first = sealResilienceReplay(replayableInput());
    const second = sealResilienceReplay(replayableInput());
    expect(first.result.propagationReconstructed).toBe(true);
    expect(first.result.failuresReconstructed).toBe(true);
    expect(first.result.governanceReconstructed).toBe(true);
    expect(first.validation.observabilityReconstructed).toBe(true);
    expect(first.evidencePath.propagationReferences).toEqual(second.evidencePath.propagationReferences);
    expect(first.evidencePath.failureReferences).toEqual(second.evidencePath.failureReferences);
    expect(first.evidencePath.observabilityReferences).toEqual(second.evidencePath.observabilityReferences);
  });

  it("surfaces replay artifact degradation as LIMITED", () => {
    const base = replayableInput();
    const limited = sealResilienceReplay({
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

  it("surfaces replay hash, lineage, propagation, governance, and observability failures as ESCALATED or INVALID", () => {
    const base = replayableInput();
    const replayMismatch = sealResilienceReplay({
      ...base,
      trustReplay: {
        ...base.trustReplay,
        result: { ...base.trustReplay.result, replayState: "ESCALATED" },
      },
    });
    const lineageBroken = sealResilienceReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          lineageReferences: Object.freeze([]),
        },
      },
    });
    const propagationMismatch = sealResilienceReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          propagationReferences: Object.freeze([]),
        },
      },
    });
    const governanceDegraded = sealResilienceReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          governanceReferences: Object.freeze([]),
        },
      },
    });
    const observabilityBroken = sealResilienceReplay({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          resilienceAuditVisible: false,
        },
        evidencePath: {
          ...base.observability.evidencePath,
          auditReferences: Object.freeze([]),
        },
      },
    });
    const governanceCorrupted = sealResilienceReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          governanceCertification: {
            ...base.recommendations[0].governanceCertification,
            result: { ...base.recommendations[0].governanceCertification.result, certificationState: "FAIL" },
          },
        },
        base.recommendations[1],
      ]),
    });

    expect(replayMismatch.result.replayState).toBe("ESCALATED");
    expect(replayMismatch.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
    expect(lineageBroken.result.replayState).toBe("ESCALATED");
    expect(lineageBroken.validation.reasonCodes).toContain("LINEAGE_CONTINUITY_BROKEN");
    expect(propagationMismatch.result.replayState).toBe("ESCALATED");
    expect(propagationMismatch.validation.reasonCodes).toContain("PROPAGATION_MISMATCH_DETECTED");
    expect(governanceDegraded.result.replayState).toBe("ESCALATED");
    expect(governanceDegraded.validation.reasonCodes).toContain("GOVERNANCE_DEGRADATION_SURFACED");
    expect(observabilityBroken.result.replayState).toBe("ESCALATED");
    expect(observabilityBroken.validation.reasonCodes).toContain("OBSERVABILITY_RECONSTRUCTION_BROKEN");
    expect(governanceCorrupted.result.replayState).toBe("INVALID");
    expect(governanceCorrupted.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
  });

  it("blocks cross-tenant replay, ownership mismatches, execution, mutation, routing, prioritization, ranking, approval, repair, and authority expansion", () => {
    const base = replayableInput();
    const crossTenant = sealResilienceReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealResilienceReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
        base.recommendations[1],
      ]),
    });

    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_REPLAY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealResilienceReplay({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealResilienceReplay({ ...base, replayMutationAttempted: true }).validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
    expect(sealResilienceReplay({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealResilienceReplay({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealResilienceReplay({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealResilienceReplay({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealResilienceReplay({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealResilienceReplay({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds replay, lineage, and disruption counts at the declared limits", () => {
    const base = replayableInput();
    const replayOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `replay:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const lineageOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const disruptionOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `disruption:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const limited = sealResilienceReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          replayReferences: replayOverflow,
          lineageReferences: lineageOverflow,
        },
      },
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          disruptionReferences: disruptionOverflow,
        },
      },
    });
    expect(limited.result.replayState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("DISRUPTION_REFERENCE_LIMIT_EXCEEDED");
  });
});
