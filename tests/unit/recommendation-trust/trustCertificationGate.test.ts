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
  buildTrustCertificationRequest,
  buildTrustObservabilityRequest,
  buildTrustReplayRequest,
  createTrustCertificationEvidencePath,
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

function analysisInput(overrides: Partial<TrustAnalysisInput> = {}): TrustAnalysisInput {
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

function observabilityInput(overrides: Partial<TrustObservabilityInput> = {}): TrustObservabilityInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(analysisInput({
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

function replayInput(overrides: Partial<TrustReplayInput> = {}): TrustReplayInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(analysisInput({
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const observability = overrides.observability ?? sealTrustObservability(observabilityInput({
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

function certificationInput(overrides: Partial<TrustCertificationInput> = {}): TrustCertificationInput {
  const base = trustInput();
  const foundation = overrides.foundation ?? sealRecommendationTrustFoundation(base);
  const analysis = overrides.analysis ?? sealTrustAnalysis(analysisInput({
    foundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const observability = overrides.observability ?? sealTrustObservability(observabilityInput({
    foundation,
    analysis,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const replay = overrides.replay ?? sealTrustReplay(replayInput({
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

function replayableCertificationReplay(input: TrustCertificationInput["replay"]) {
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

describe("trustCertificationGate", () => {
  it("certifies trust deterministically with stable hashes", () => {
    const base = certificationInput();
    const input = certificationInput({
      replay: replayableCertificationReplay(base.replay),
    });
    const first = sealTrustCertification(input);
    const second = sealTrustCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps certification ordering deterministic", () => {
    const input = certificationInput();
    const reversed = certificationInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealTrustCertification(reversed)).toEqual(sealTrustCertification(input));
    expect(createTrustCertificationEvidencePath(reversed)).toEqual(createTrustCertificationEvidencePath(input));
  });

  it("certifies VERY_STRONG, STRONG, MODERATE, WEAK, and CRITICAL strengths reproducibly", () => {
    const veryStrong = sealTrustCertification(certificationInput({
      replay: {
        ...certificationInput().replay,
        result: { ...certificationInput().replay.result, replayState: "REPLAYABLE" },
      },
      analysis: sealTrustAnalysis(analysisInput({
        request: buildTrustAnalysisRequest({
          tenantId: "tenant-alpha",
          recommendationIds: ["recommendation-alpha", "recommendation-beta"],
          analysisScope: "STRENGTH",
          graphVersion: "decision-graph/v1",
        }),
      })),
    }));

    const strongFoundation = sealRecommendationTrustFoundation({
      ...trustInput(),
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha"],
        trustScope: "REPLAY",
        graphVersion: "decision-graph/v1",
      }),
      driftReplay: {
        ...trustInput().driftReplay,
        result: { ...trustInput().driftReplay.result, replayState: "LIMITED" },
      },
    });
    const strongAnalysis = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: strongFoundation,
    }));
    const strongReplay = sealTrustReplay(replayInput({
      foundation: strongFoundation,
      analysis: strongAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: strongFoundation,
        analysis: strongAnalysis,
      })),
      driftReplay: {
        ...trustInput().driftReplay,
        result: { ...trustInput().driftReplay.result, replayState: "REPLAYABLE" },
      },
    }));
    const strong = sealTrustCertification(certificationInput({
      foundation: strongFoundation,
      analysis: strongAnalysis,
      replay: strongReplay,
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
    const moderateAnalysis = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: moderateFoundation,
      recommendations: moderateRecommendations,
    }));
    const moderateReplay = sealTrustReplay(replayInput({
      foundation: moderateFoundation,
      analysis: moderateAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: moderateFoundation,
        analysis: moderateAnalysis,
        recommendations: moderateRecommendations,
      })),
      recommendations: moderateRecommendations,
      driftReplay: {
        ...trustInput().driftReplay,
        result: { ...trustInput().driftReplay.result, replayState: "REPLAYABLE" },
      },
    }));
    const moderate = sealTrustCertification(certificationInput({
      foundation: moderateFoundation,
      analysis: moderateAnalysis,
      replay: moderateReplay,
      recommendations: moderateRecommendations,
    }));

    const weakScenario = buildDriftScenario({ foundation: driftedFoundation(), recommendations: cachedDriftedRecommendations });
    const weakFoundation = sealRecommendationTrustFoundation({
      ...trustInput({
        driftFoundation: weakScenario.foundation,
        driftReplay: weakScenario.replay,
        driftCertification: weakScenario.certification,
        recommendations: weakScenario.recommendations,
      }),
      request: buildRecommendationTrustFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        trustScope: "DRIFT",
        graphVersion: "decision-graph/v1",
      }),
      driftFoundation: {
        ...weakScenario.foundation,
        evidencePath: { ...weakScenario.foundation.evidencePath, driftReferences: Object.freeze([]) },
      },
    });
    const weakAnalysis = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: weakFoundation,
      driftReplay: weakScenario.replay,
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    const weakReplay = sealTrustReplay(replayInput({
      foundation: weakFoundation,
      analysis: weakAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: weakFoundation,
        analysis: weakAnalysis,
        driftReplay: weakScenario.replay,
        driftCertification: weakScenario.certification,
        recommendations: weakScenario.recommendations,
      })),
      driftReplay: {
        ...weakScenario.replay,
        result: { ...weakScenario.replay.result, replayState: "REPLAYABLE" },
      },
      driftCertification: weakScenario.certification,
      recommendations: weakScenario.recommendations,
    }));
    const weak = sealTrustCertification(certificationInput({
      foundation: weakFoundation,
      analysis: weakAnalysis,
      replay: weakReplay,
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
    const criticalAnalysis = sealTrustAnalysis(analysisInput({
      request: buildTrustAnalysisRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha", "recommendation-beta"],
        analysisScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
      foundation: criticalFoundation,
      recommendations: criticalRecommendations,
    }));
    const criticalReplay = sealTrustReplay(replayInput({
      foundation: criticalFoundation,
      analysis: criticalAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: criticalFoundation,
        analysis: criticalAnalysis,
        recommendations: criticalRecommendations,
      })),
      recommendations: criticalRecommendations,
    }));
    const critical = sealTrustCertification(certificationInput({
      foundation: criticalFoundation,
      analysis: criticalAnalysis,
      replay: criticalReplay,
      recommendations: criticalRecommendations,
    }));

    expect(veryStrong.evidencePath.strengthReferences.some((ref) => ref.endsWith(":VERY_STRONG"))).toBe(true);
    expect(strong.evidencePath.strengthReferences.some((ref) => ref.endsWith(":STRONG"))).toBe(true);
    expect(moderate.evidencePath.strengthReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(weak.evidencePath.strengthReferences.some((ref) => ref.endsWith(":WEAK"))).toBe(true);
    expect(critical.evidencePath.strengthReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("certifies integrity, propagation, governance, observability, and lineage", () => {
    const base = certificationInput();
    const sealed = sealTrustCertification({
      ...base,
      replay: replayableCertificationReplay(base.replay),
    });
    expect(sealed.result.certificationState).toBe("PASS");
    expect(sealed.result.integrityCertified).toBe(true);
    expect(sealed.result.propagationCertified).toBe(true);
    expect(sealed.result.governanceCertified).toBe(true);
    expect(sealed.result.observabilityCertified).toBe(true);
    expect(sealed.validation.lineageCertified).toBe(true);
  });

  it("surfaces replay degradation and observability incompleteness as CONDITIONAL_PASS", () => {
    const base = certificationInput();
    const replayDegraded = sealTrustCertification({
      ...base,
      replay: {
        ...replayableCertificationReplay(base.replay),
        result: {
          ...replayableCertificationReplay(base.replay).result,
          replayState: "LIMITED",
        },
      },
    });
    const observabilityIncomplete = sealTrustCertification({
      ...base,
      replay: replayableCertificationReplay(base.replay),
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          observabilityState: "LIMITED",
          trustReplayVisible: false,
        },
      },
    });
    expect(replayDegraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayDegraded.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityIncomplete.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityIncomplete.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
  });

  it("fails on cross-tenant certification, ownership mismatch, replay corruption, and governance corruption", () => {
    const base = certificationInput();
    const crossTenant = sealTrustCertification({
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
    const ownershipMismatch = sealTrustCertification({
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
    const replayCorrupted = sealTrustCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "ESCALATED",
        },
      },
    });
    const governanceCorrupted = sealTrustCertification({
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
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(replayCorrupted.result.certificationState).toBe("FAIL");
    expect(replayCorrupted.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(governanceCorrupted.result.certificationState).toBe("FAIL");
    expect(governanceCorrupted.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
  });

  it("blocks execution, mutation, prioritization, ranking, approval, workflow routing, and authority expansion", () => {
    const base = certificationInput();
    expect(sealTrustCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTrustCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealTrustCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTrustCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTrustCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTrustCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealTrustCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds certification counts at the declared limits", () => {
    const base = certificationInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const failed = sealTrustCertification({
      ...base,
      replay: {
        ...replayableCertificationReplay(base.replay),
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
