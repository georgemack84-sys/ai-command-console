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
  buildTrustReplayRequest,
  createTrustReplayEvidencePath,
  sealRecommendationTrustFoundation,
  sealTrustAnalysis,
  sealTrustObservability,
  sealTrustReplay,
  type RecommendationTrustFoundationInput,
  type TrustAnalysisInput,
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

describe("trustReplayFramework", () => {
  it("reconstructs trust deterministically with stable hashes", () => {
    const input = replayInput();
    const first = sealTrustReplay(input);
    const second = sealTrustReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayState).toBe("ESCALATED");
    expect(first.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps replay evidence ordering deterministic", () => {
    const input = replayInput();
    const reversed = replayInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealTrustReplay(reversed)).toEqual(sealTrustReplay(input));
    expect(createTrustReplayEvidencePath(reversed)).toEqual(createTrustReplayEvidencePath(input));
  });

  it("reconstructs VERY_STRONG, STRONG, MODERATE, WEAK, and CRITICAL strengths reproducibly", () => {
    const veryStrong = sealTrustReplay(replayInput({
      request: buildTrustReplayRequest({
        tenantId: "tenant-alpha",
        replayScope: "STRENGTH",
        replayVersion: "trust-replay/v1",
        graphVersion: "decision-graph/v1",
      }),
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
    const strong = sealTrustReplay(replayInput({
      foundation: strongFoundation,
      analysis: strongAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: strongFoundation,
        analysis: strongAnalysis,
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
    const moderate = sealTrustReplay(replayInput({
      foundation: moderateFoundation,
      analysis: moderateAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: moderateFoundation,
        analysis: moderateAnalysis,
        recommendations: moderateRecommendations,
      })),
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
    const weak = sealTrustReplay(replayInput({
      foundation: weakFoundation,
      analysis: weakAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: weakFoundation,
        analysis: weakAnalysis,
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
    const critical = sealTrustReplay(replayInput({
      foundation: criticalFoundation,
      analysis: criticalAnalysis,
      observability: sealTrustObservability(observabilityInput({
        foundation: criticalFoundation,
        analysis: criticalAnalysis,
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

  it("reconstructs propagation, conflicts, governance, and observability reproducibly", () => {
    const first = sealTrustReplay(replayInput());
    const second = sealTrustReplay(replayInput());
    expect(first.result.propagationReconstructed).toBe(true);
    expect(first.result.conflictsReconstructed).toBe(true);
    expect(first.result.governanceReconstructed).toBe(true);
    expect(first.validation.observabilityReconstructed).toBe(true);
    expect(first.evidencePath.propagationReferences).toEqual(second.evidencePath.propagationReferences);
    expect(first.evidencePath.conflictReferences).toEqual(second.evidencePath.conflictReferences);
    expect(first.evidencePath.observabilityReferences).toEqual(second.evidencePath.observabilityReferences);
  });

  it("surfaces replay artifact degradation as LIMITED", () => {
    const base = replayInput();
    const limited = sealTrustReplay({
      ...base,
      driftReplay: {
        ...base.driftReplay,
        result: { ...base.driftReplay.result, replayState: "REPLAYABLE" },
      },
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
    const base = replayInput();
    const replayMismatch = sealTrustReplay({
      ...base,
      driftReplay: {
        ...base.driftReplay,
        result: { ...base.driftReplay.result, replayState: "ESCALATED" },
      },
    });
    const lineageBroken = sealTrustReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          lineageReferences: Object.freeze([]),
        },
      },
    });
    const propagationMismatch = sealTrustReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          propagationReferences: Object.freeze([]),
        },
      },
    });
    const governanceDegraded = sealTrustReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          governanceReferences: Object.freeze([]),
        },
      },
    });
    const observabilityBroken = sealTrustReplay({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          trustAuditVisible: false,
        },
        evidencePath: {
          ...base.observability.evidencePath,
          auditReferences: Object.freeze([]),
        },
      },
    });
    const governanceCorrupted = sealTrustReplay({
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

  it("blocks cross-tenant replay, ownership mismatches, execution, mutation, routing, prioritization, ranking, approval, and authority expansion", () => {
    const base = replayInput();
    const crossTenant = sealTrustReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealTrustReplay({
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
    expect(sealTrustReplay({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTrustReplay({ ...base, replayMutationAttempted: true }).validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
    expect(sealTrustReplay({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealTrustReplay({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTrustReplay({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTrustReplay({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTrustReplay({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds replay and lineage counts at the declared limits", () => {
    const base = replayInput();
    const replayOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `replay:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const lineageOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const limited = sealTrustReplay({
      ...base,
      driftReplay: {
        ...base.driftReplay,
        result: { ...base.driftReplay.result, replayState: "REPLAYABLE" },
      },
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          replayReferences: replayOverflow,
          lineageReferences: lineageOverflow,
        },
      },
    });
    expect(limited.result.replayState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  });
});
