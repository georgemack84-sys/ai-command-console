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
  buildResilienceCertificationRequest,
  buildResilienceObservabilityRequest,
  buildResilienceReplayRequest,
  createResilienceCertificationEvidencePath,
  sealRecommendationResilienceFoundation,
  sealResilienceAnalysis,
  sealResilienceCertification,
  sealResilienceObservability,
  sealResilienceReplay,
  type RecommendationResilienceFoundationInput,
  type ResilienceAnalysisInput,
  type ResilienceCertificationInput,
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

function replayableInput(overrides: Partial<ResilienceReplayInput> = {}): ResilienceReplayInput {
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
      resilienceGapsDetected: 0,
      resilienceFailuresDetected: 0,
    },
    evidencePath: {
      ...baseObservability.analysis.evidencePath,
      gapReferences: Object.freeze([]),
      failureReferences: Object.freeze([]),
    },
    validation: {
      ...baseObservability.analysis.validation,
      resilienceGapsDetected: 0,
      resilienceFailuresDetected: 0,
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
        governanceCertified: true,
      },
    },
    driftReplay: normalizedDriftReplay,
    driftCertification: {
      ...baseObservability.driftCertification,
      result: {
        ...baseObservability.driftCertification.result,
        certificationState: "PASS",
        governanceCertified: true,
      },
    },
    impactCertification: {
      ...baseObservability.impactCertification,
      result: {
        ...baseObservability.impactCertification.result,
        certificationState: "PASS",
        governanceCertified: true,
      },
    },
    dependencyCertification: {
      ...baseObservability.dependencyCertification,
      result: {
        ...baseObservability.dependencyCertification.result,
        certificationState: "PASS",
        governanceCertified: true,
      },
    },
    portfolioCertification: {
      ...baseObservability.portfolioCertification,
      result: {
        ...baseObservability.portfolioCertification.result,
        certificationState: "PASS",
        governanceCertified: true,
      },
    },
    recommendations: baseObservability.recommendations,
    ...overrides,
  } satisfies ResilienceReplayInput);
}

function certifiableInput(overrides: Partial<ResilienceCertificationInput> = {}): ResilienceCertificationInput {
  const replayInput = replayableInput();
  const replay = overrides.replay ?? sealResilienceReplay(replayInput);
  return Object.freeze({
    request: buildResilienceCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: overrides.foundation ?? replayInput.foundation,
    analysis: overrides.analysis ?? replayInput.analysis,
    observability: overrides.observability ?? replayInput.observability,
    replay,
    trustCertification: overrides.trustCertification ?? replayInput.trustCertification,
    driftCertification: overrides.driftCertification ?? replayInput.driftCertification,
    impactCertification: overrides.impactCertification ?? replayInput.impactCertification,
    dependencyCertification: overrides.dependencyCertification ?? replayInput.dependencyCertification,
    portfolioCertification: overrides.portfolioCertification ?? replayInput.portfolioCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
    ...overrides,
  } satisfies ResilienceCertificationInput);
}

describe("resilienceCertificationGate", () => {
  it("certifies deterministically with stable hashes", () => {
    const input = certifiableInput();
    const first = sealResilienceCertification(input);
    const second = sealResilienceCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps certification evidence ordering deterministic", () => {
    const input = certifiableInput();
    const reversed = certifiableInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealResilienceCertification(reversed)).toEqual(sealResilienceCertification(input));
    expect(createResilienceCertificationEvidencePath(reversed)).toEqual(createResilienceCertificationEvidencePath(input));
  });

  it("preserves resilience strength, propagation, replay, governance, recoverability, disruption tolerance, and lineage certification", () => {
    const certified = sealResilienceCertification(certifiableInput({
      request: buildResilienceCertificationRequest({
        tenantId: "tenant-alpha",
        certificationScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
    }));
    expect(certified.evidencePath.strengthReferences.some((ref) => ref.endsWith(":VERY_RESILIENT") || ref.endsWith(":RESILIENT") || ref.endsWith(":MODERATELY_RESILIENT") || ref.endsWith(":WEAK") || ref.endsWith(":FRAGILE"))).toBe(true);
    expect(certified.result.propagationCertified).toBe(true);
    expect(certified.result.replayCertified).toBe(true);
    expect(certified.result.governanceCertified).toBe(true);
    expect(certified.result.observabilityCertified).toBe(true);
    expect(certified.result.recoverabilityCertified).toBe(true);
    expect(certified.result.disruptionToleranceCertified).toBe(true);
    expect(certified.validation.lineageCertified).toBe(true);
  });

  it("returns CONDITIONAL_PASS for replay degradation, observability incompleteness, and bounded disruption concern", () => {
    const replayLimited = sealResilienceCertification(certifiableInput({
      replay: {
        ...sealResilienceReplay(replayableInput()),
        result: {
          ...sealResilienceReplay(replayableInput()).result,
          replayState: "LIMITED",
        },
      },
    }));
    const observabilityLimited = sealResilienceCertification(certifiableInput({
      observability: {
        ...certifiableInput().observability,
        result: {
          ...certifiableInput().observability.result,
          observabilityState: "LIMITED",
          resilienceAuditVisible: false,
        },
      },
    }));
    const boundedDisruption = sealResilienceCertification(certifiableInput({
      foundation: {
        ...certifiableInput().foundation,
        result: {
          ...certifiableInput().foundation.result,
          resilienceState: "DEGRADED",
        },
      },
    }));

    expect(replayLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityLimited.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
    expect(boundedDisruption.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(boundedDisruption.validation.reasonCodes).toContain("BOUNDED_DISRUPTION_CONCERN");
  });

  it("fails on corruption, integrity breaks, lineage breaks, and disruption tolerance breaks", () => {
    const base = certifiableInput();
    const replayCorrupted = sealResilienceCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "ESCALATED",
        },
      },
    });
    const integrityBroken = sealResilienceCertification({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          baselineReferences: Object.freeze([]),
        },
      },
    });
    const lineageBroken = sealResilienceCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          lineage: {
            ...base.recommendations[0].lineage,
            result: {
              ...base.recommendations[0].lineage.result,
              lineageIntegrity: false,
            },
          },
        },
        base.recommendations[1],
      ]),
    });
    const disruptionBroken = sealResilienceCertification({
      ...base,
      foundation: {
        ...base.foundation,
        result: {
          ...base.foundation.result,
          resilienceState: "FRAGILE",
        },
      },
    });

    expect(replayCorrupted.result.certificationState).toBe("FAIL");
    expect(replayCorrupted.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(integrityBroken.result.certificationState).toBe("FAIL");
    expect(integrityBroken.validation.reasonCodes).toContain("INTEGRITY_BROKEN");
    expect(lineageBroken.result.certificationState).toBe("FAIL");
    expect(lineageBroken.validation.reasonCodes).toContain("LINEAGE_CORRUPTION_DETECTED");
    expect(disruptionBroken.result.certificationState).toBe("FAIL");
    expect(disruptionBroken.validation.reasonCodes).toContain("DISRUPTION_TOLERANCE_BROKEN");
  });

  it("blocks cross-tenant certification, ownership mismatches, execution, mutation, routing, prioritization, ranking, approval, repair, and authority expansion", () => {
    const base = certifiableInput();
    const crossTenant = sealResilienceCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealResilienceCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
        base.recommendations[1],
      ]),
    });

    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealResilienceCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealResilienceCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealResilienceCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealResilienceCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealResilienceCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealResilienceCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealResilienceCertification({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealResilienceCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds replay, lineage, disruption, and propagation counts at declared limits", () => {
    const base = certifiableInput();
    const propagationOverflow = Object.freeze(Array.from(
      { length: 25_001 },
      (_, index) => `propagation:overflow:${index.toString().padStart(5, "0")}`,
    ));
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
    const limited = sealResilienceCertification({
      ...base,
      analysis: {
        ...base.analysis,
        evidencePath: {
          ...base.analysis.evidencePath,
          propagationReferences: propagationOverflow,
        },
      },
      replay: {
        ...base.replay,
        evidencePath: {
          ...base.replay.evidencePath,
          replayReferences: replayOverflow,
          lineageReferences: lineageOverflow,
          disruptionReferences: disruptionOverflow,
        },
      },
    });

    expect(limited.result.certificationState).toBe("FAIL");
    expect(limited.validation.reasonCodes).toContain("PROPAGATION_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("DISRUPTION_REFERENCE_LIMIT_EXCEEDED");
  });
});
