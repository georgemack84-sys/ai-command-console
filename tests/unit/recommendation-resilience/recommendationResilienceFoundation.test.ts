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
  buildTrustCertificationRequest,
  buildTrustObservabilityRequest,
  buildTrustReplayRequest,
  buildTrustAnalysisRequest,
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
  buildRecommendationResilienceFoundationRequest,
  sealRecommendationResilienceFoundation,
  type RecommendationResilienceFoundationInput,
} from "@/services/recommendation-resilience";
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

function resilienceInput(overrides: Partial<RecommendationResilienceFoundationInput> = {}): RecommendationResilienceFoundationInput {
  const drift = buildDriftScenario();
  const trustFoundation = overrides.trustFoundation ?? sealRecommendationTrustFoundation(trustInput({
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const analysis = sealTrustAnalysis(analysisInput({
    foundation: trustFoundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const observability = sealTrustObservability(observabilityInput({
    foundation: trustFoundation,
    analysis,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const trustReplay = overrides.trustReplay ?? sealTrustReplay(replayInput({
    foundation: trustFoundation,
    analysis,
    observability,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const trustCertification = overrides.trustCertification ?? sealTrustCertification(certificationInput({
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

function makeTrustRecordsState(
  input: RecommendationResilienceFoundationInput["trustFoundation"],
  state: "TRUSTED" | "CONDITIONALLY_TRUSTED" | "DEGRADED" | "UNTRUSTED" | "UNKNOWN",
) {
  return {
    ...input,
    result: {
      ...input.result,
      trustState: state,
    },
    trusts: Object.freeze(input.trusts.map((trust) => ({
      ...trust,
      trustState: state,
    }))),
  };
}

function patchTrustRecordState(
  input: RecommendationResilienceFoundationInput["trustFoundation"],
  recommendationIdValue: string,
  trustDimension: string,
  state: "TRUSTED" | "CONDITIONALLY_TRUSTED" | "DEGRADED" | "UNTRUSTED" | "UNKNOWN",
) {
  return {
    ...input,
    trusts: Object.freeze(input.trusts.map((trust) => (
      trust.recommendationId === recommendationIdValue && trust.trustDimension === trustDimension
        ? { ...trust, trustState: state }
        : trust
    ))),
  };
}

function makeResilientReplay(input: RecommendationResilienceFoundationInput["trustReplay"]) {
  return {
    ...input,
    result: {
      ...input.result,
      replayState: "REPLAYABLE" as const,
      propagationReconstructed: true,
      governanceReconstructed: true,
    },
    validation: {
      ...input.validation,
      propagationReconstructed: true,
      governanceReconstructed: true,
    },
  };
}

function makeResilientCertification(input: RecommendationResilienceFoundationInput["trustCertification"]) {
  return {
    ...input,
    result: {
      ...input.result,
      certificationState: "PASS" as const,
      integrityCertified: true,
      strengthCertified: true,
      propagationCertified: true,
      replayCertified: true,
      governanceCertified: true,
      observabilityCertified: true,
    },
    validation: {
      ...input.validation,
      integrityCertified: true,
      strengthCertified: true,
      propagationCertified: true,
      replayCertified: true,
      governanceCertified: true,
      observabilityCertified: true,
    },
  };
}

const alphaRecommendation = () => {
  const base = resilienceInput();
  return base.recommendations.find((recommendation) => recommendation.ledger.entry.recommendationId === "recommendation-alpha")
    ?? base.recommendations[0];
};

describe("recommendationResilienceFoundation", () => {
  it("is deterministic and reproduces the same resilience graph hash", () => {
    const base = resilienceInput();
    const input = resilienceInput({
      trustFoundation: makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    });
    const first = sealRecommendationResilienceFoundation(input);
    const second = sealRecommendationResilienceFoundation(input);
    expect(first).toEqual(second);
    expect(first.result.resilienceGraphHash).toHaveLength(64);
  });

  it("keeps resilience ordering deterministic", () => {
    const input = resilienceInput();
    const reversed = resilienceInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealRecommendationResilienceFoundation(reversed)).toEqual(sealRecommendationResilienceFoundation(input));
  });

  it("builds evidence, lineage, governance, replay, readiness, portfolio, dependency, impact, drift, and trust resilience records reproducibly", () => {
    const base = resilienceInput();
    const sealed = sealRecommendationResilienceFoundation(resilienceInput({
      trustFoundation: makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    }));
    const dimensions = new Set(sealed.resiliences.map((record) => record.resilienceDimension));
    expect(dimensions.has("EVIDENCE_RESILIENCE")).toBe(true);
    expect(dimensions.has("LINEAGE_RESILIENCE")).toBe(true);
    expect(dimensions.has("GOVERNANCE_RESILIENCE")).toBe(true);
    expect(dimensions.has("REPLAY_RESILIENCE")).toBe(true);
    expect(dimensions.has("READINESS_RESILIENCE")).toBe(true);
    expect(dimensions.has("PORTFOLIO_RESILIENCE")).toBe(true);
    expect(dimensions.has("DEPENDENCY_RESILIENCE")).toBe(true);
    expect(dimensions.has("IMPACT_RESILIENCE")).toBe(true);
    expect(dimensions.has("DRIFT_RESILIENCE")).toBe(true);
    expect(dimensions.has("TRUST_RESILIENCE")).toBe(true);
  });

  it("reproduces RESILIENT, CONDITIONALLY_RESILIENT, DEGRADED, FRAGILE, and UNKNOWN states", () => {
    const base = resilienceInput();
    const resilient = sealRecommendationResilienceFoundation(resilienceInput({
      trustFoundation: makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    }));
    const conditional = sealRecommendationResilienceFoundation(resilienceInput({
      request: buildRecommendationResilienceFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha"],
        resilienceScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([alphaRecommendation()]),
      trustFoundation: patchTrustRecordState(
        makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
        "recommendation-alpha",
        "EVIDENCE_TRUST",
        "CONDITIONALLY_TRUSTED",
      ),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    }));
    const degraded = sealRecommendationResilienceFoundation(resilienceInput({
      request: buildRecommendationResilienceFoundationRequest({
        tenantId: "tenant-alpha",
        recommendationIds: ["recommendation-alpha"],
        resilienceScope: "FULL",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([alphaRecommendation()]),
      trustFoundation: patchTrustRecordState(
        patchTrustRecordState(
          makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
          "recommendation-alpha",
          "EVIDENCE_TRUST",
          "CONDITIONALLY_TRUSTED",
        ),
        "recommendation-alpha",
        "REPLAY_TRUST",
        "CONDITIONALLY_TRUSTED",
      ),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: {
        ...makeResilientCertification(base.trustCertification),
        result: {
          ...makeResilientCertification(base.trustCertification).result,
          certificationState: "CONDITIONAL_PASS",
        },
      },
    }));
    const fragile = sealRecommendationResilienceFoundation(resilienceInput({
      trustFoundation: makeTrustRecordsState(base.trustFoundation, "UNTRUSTED"),
      trustReplay: {
        ...base.trustReplay,
        result: { ...base.trustReplay.result, replayState: "ESCALATED" },
      },
      trustCertification: {
        ...base.trustCertification,
        result: { ...base.trustCertification.result, certificationState: "FAIL", governanceCertified: false },
      },
    }));
    const unknown = sealRecommendationResilienceFoundation(resilienceInput({
      trustFoundation: {
        ...makeTrustRecordsState(base.trustFoundation, "UNKNOWN"),
        evidencePath: {
          ...base.trustFoundation.evidencePath,
          trustReferences: Object.freeze([]),
        },
      },
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    }));

    expect(resilient.result.resilienceState).toBe("RESILIENT");
    expect(conditional.result.resilienceState).toBe("CONDITIONALLY_RESILIENT");
    expect(degraded.result.resilienceState).toBe("DEGRADED");
    expect(fragile.result.resilienceState).toBe("FRAGILE");
    expect(unknown.result.resilienceState).toBe("UNKNOWN");
  });

  it("preserves resilience continuity across evidence, lineage, replay, and trust references", () => {
    const base = resilienceInput();
    const sealed = sealRecommendationResilienceFoundation(resilienceInput({
      trustFoundation: makeTrustRecordsState(base.trustFoundation, "TRUSTED"),
      trustReplay: makeResilientReplay(base.trustReplay),
      trustCertification: makeResilientCertification(base.trustCertification),
    }));
    expect(sealed.evidencePath.evidenceReferences.length).toBeGreaterThan(0);
    expect(sealed.evidencePath.lineageReferences.length).toBeGreaterThan(0);
    expect(sealed.evidencePath.replayReferences.length).toBeGreaterThan(0);
    expect(sealed.evidencePath.trustReferences.length).toBeGreaterThan(0);
    expect(sealed.evidencePath.disruptionReferences.length).toBeGreaterThan(0);
  });

  it("blocks cross-tenant resilience and ownership mismatches", () => {
    const base = resilienceInput();
    const crossTenant = sealRecommendationResilienceFoundation(resilienceInput({
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
    }));
    const ownershipMismatch = sealRecommendationResilienceFoundation(resilienceInput({
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
    }));
    expect(crossTenant.result.resilienceState).toBe("FRAGILE");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_RESILIENCE_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, approval, ranking, prioritization, repair, mutation, and authority expansion", () => {
    const base = resilienceInput();
    expect(sealRecommendationResilienceFoundation({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationResilienceFoundation({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealRecommendationResilienceFoundation({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealRecommendationResilienceFoundation({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealRecommendationResilienceFoundation({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealRecommendationResilienceFoundation({ ...base, resilienceMutationAttempted: true }).validation.reasonCodes).toContain("RESILIENCE_MUTATION_DETECTED");
    expect(sealRecommendationResilienceFoundation({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds resilience counts at the declared limits", () => {
    const base = resilienceInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const failed = sealRecommendationResilienceFoundation(resilienceInput({
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ledger: {
            ...base.recommendations[0].ledger,
            entry: {
              ...base.recommendations[0].ledger.entry,
              lineageReferences: overflow,
            },
          },
        },
        base.recommendations[1],
      ]),
    }));
    expect(failed.result.resilienceState).toBe("FRAGILE");
    expect(failed.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  });
});
