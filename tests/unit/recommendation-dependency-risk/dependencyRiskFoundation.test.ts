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
  buildDependencyRiskFoundationRequest,
  createDependencyRiskEvidencePath,
  sealDependencyRiskFoundation,
  type DependencyRiskFoundationInput,
} from "@/services/recommendation-dependency-risk";
import {
  buildRecommendationResilienceFoundationRequest,
  buildResilienceAnalysisRequest,
  buildResilienceCertificationRequest,
  buildResilienceObservabilityRequest,
  buildResilienceReplayRequest,
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
  sealPortfolioCertification,
  sealPortfolioObservability,
} from "@/services/recommendation-portfolio";
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
const cachedDependencyInput = dependencyCertificationInput(cachedSource);
const cachedDependencyCertification = sealDependencyCertification(cachedDependencyInput);
const cachedDependencyObservability = sealDependencyObservability(dependencyObservabilityInput(cachedSource));
const cachedImpactInput = impactCertificationInput();
const cachedImpactCertification = sealImpactCertification(cachedImpactInput);
const cachedPortfolioCertification = sealPortfolioCertification(portfolioCertificationInput(cachedSource));
const cachedPortfolioObservability = sealPortfolioObservability(portfolioObservabilityInput(cachedSource));
const cachedStableRecommendations = driftFoundationInput().currentRecommendations;
const cachedDriftAnalysisInput = driftAnalysisInput();

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
  const drift = buildDriftScenario();
  return Object.freeze({
    request: buildRecommendationTrustFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-beta", "recommendation-alpha"],
      trustScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: drift.recommendations,
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

function resilienceReplayInput(overrides: Partial<ResilienceReplayInput> = {}): ResilienceReplayInput {
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
  const observability = overrides.observability ?? sealResilienceObservability(resilienceObservabilityInput({
    foundation,
    analysis,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
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
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies ResilienceReplayInput);
}

function resilienceCertificationInput(overrides: Partial<ResilienceCertificationInput> = {}): ResilienceCertificationInput {
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
  const observability = overrides.observability ?? sealResilienceObservability(resilienceObservabilityInput({
    foundation,
    analysis,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  const replay = overrides.replay ?? sealResilienceReplay(resilienceReplayInput({
    foundation,
    analysis,
    observability,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
  }));
  return Object.freeze({
    request: buildResilienceCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    replay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    impactCertification: cachedImpactCertification,
    dependencyCertification: cachedDependencyCertification,
    portfolioCertification: cachedPortfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    ...overrides,
  } satisfies ResilienceCertificationInput);
}

function stableTrustFoundation(record: ReturnType<typeof sealRecommendationTrustFoundation>) {
  return {
    ...record,
    result: { ...record.result, trustState: "TRUSTED" as const },
    trusts: Object.freeze(record.trusts.map((trust) => ({ ...trust, trustState: "TRUSTED" as const }))),
  };
}

function stableTrustReplay(record: ReturnType<typeof sealTrustReplay>) {
  return {
    ...record,
    result: {
      ...record.result,
      replayState: "REPLAYABLE" as const,
      propagationReconstructed: true,
      governanceReconstructed: true,
    },
    validation: {
      ...record.validation,
      propagationReconstructed: true,
      governanceReconstructed: true,
    },
  };
}

function stableTrustCertification(record: ReturnType<typeof sealTrustCertification>) {
  return {
    ...record,
    result: {
      ...record.result,
      certificationState: "PASS" as const,
      integrityCertified: true,
      strengthCertified: true,
      propagationCertified: true,
      replayCertified: true,
      governanceCertified: true,
      observabilityCertified: true,
    },
  };
}

function lowRiskInput(overrides: Partial<DependencyRiskFoundationInput> = {}): DependencyRiskFoundationInput {
  const dependencyFoundation = {
    ...cachedDependencyInput.foundation,
    result: { ...cachedDependencyInput.foundation.result, dependencyState: "ESTABLISHED" as const },
  };
  const dependencyReplay = {
    ...cachedDependencyInput.replay,
    result: {
      ...cachedDependencyInput.replay.result,
      replayState: "REPLAYABLE" as const,
      graphReconstructed: true,
      chainsReconstructed: true,
      evidenceReconstructed: true,
      governanceReconstructed: true,
    },
  };
  const dependencyCertification = {
    ...cachedDependencyCertification,
    result: {
      ...cachedDependencyCertification.result,
      certificationState: "PASS" as const,
      integrityCertified: true,
      continuityCertified: true,
      replayCertified: true,
      governanceCertified: true,
      observabilityCertified: true,
    },
  };
  const rawDrift = buildDriftScenario({
    foundation: {
      ...sealRecommendationDriftFoundation(driftFoundationInput()),
      result: { ...sealRecommendationDriftFoundation(driftFoundationInput()).result, driftState: "STABLE" as const },
    },
  });
  const drift = {
    ...rawDrift,
    replay: {
      ...rawDrift.replay,
      result: {
        ...rawDrift.replay.result,
        replayState: "REPLAYABLE" as const,
        severityReconstructed: true,
        propagationReconstructed: true,
        conflictsReconstructed: true,
        governanceReconstructed: true,
      },
    },
    certification: {
      ...rawDrift.certification,
      result: {
        ...rawDrift.certification.result,
        certificationState: "PASS" as const,
        integrityCertified: true,
        severityCertified: true,
        propagationCertified: true,
        replayCertified: true,
        governanceCertified: true,
        observabilityCertified: true,
      },
    },
  };
  const selectedRecommendations = Object.freeze(
    drift.recommendations.filter(
      (recommendation) => recommendation.ledger.entry.recommendationId === "recommendation-alpha",
    ),
  );
  const trustFoundation = stableTrustFoundation(sealRecommendationTrustFoundation(trustInput({
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  })));
  const trustAnalysis = sealTrustAnalysis(trustAnalysisInput({
    foundation: trustFoundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const trustObservability = sealTrustObservability(trustObservabilityInput({
    foundation: trustFoundation,
    analysis: trustAnalysis,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const trustReplay = stableTrustReplay(sealTrustReplay(trustReplayInput({
    foundation: trustFoundation,
    analysis: trustAnalysis,
    observability: trustObservability,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  })));
  const trustCertification = stableTrustCertification(sealTrustCertification(trustCertificationInput({
    foundation: trustFoundation,
    analysis: trustAnalysis,
    observability: trustObservability,
    replay: trustReplay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  })));
  const resilienceFoundation = sealRecommendationResilienceFoundation(resilienceFoundationInput({
    trustFoundation,
    trustReplay,
    trustCertification,
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const stableResilienceFoundation = {
    ...resilienceFoundation,
    result: { ...resilienceFoundation.result, resilienceState: "RESILIENT" as const },
    resiliences: Object.freeze(resilienceFoundation.resiliences.map((risk) => ({ ...risk, resilienceState: "RESILIENT" as const }))),
  };
  const resilienceAnalysis = sealResilienceAnalysis(resilienceAnalysisInput({
    foundation: stableResilienceFoundation,
    trustReplay,
    trustCertification,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const stableResilienceAnalysis = {
    ...resilienceAnalysis,
    result: {
      ...resilienceAnalysis.result,
      analysisState: "ANALYZED" as const,
      resilienceGapsDetected: 0,
      resilienceFailuresDetected: 0,
    },
    evidencePath: {
      ...resilienceAnalysis.evidencePath,
      gapReferences: Object.freeze([]),
      failureReferences: Object.freeze([]),
    },
  };
  const resilienceObservability = sealResilienceObservability(resilienceObservabilityInput({
    foundation: stableResilienceFoundation,
    analysis: stableResilienceAnalysis,
    trustReplay,
    trustCertification,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const resilienceReplay = sealResilienceReplay(resilienceReplayInput({
    foundation: stableResilienceFoundation,
    analysis: stableResilienceAnalysis,
    observability: resilienceObservability,
    trustReplay,
    trustCertification,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const stableResilienceReplay = {
    ...resilienceReplay,
    result: {
      ...resilienceReplay.result,
      replayState: "REPLAYABLE" as const,
      resilienceReconstructed: true,
      strengthReconstructed: true,
      propagationReconstructed: true,
      failuresReconstructed: true,
      governanceReconstructed: true,
    },
  };
  const resilienceCertification = sealResilienceCertification(resilienceCertificationInput({
    foundation: stableResilienceFoundation,
    analysis: stableResilienceAnalysis,
    observability: resilienceObservability,
    replay: stableResilienceReplay,
    trustCertification,
    driftCertification: drift.certification,
    recommendations: drift.recommendations,
  }));
  const stableResilienceCertification = {
    ...resilienceCertification,
    result: {
      ...resilienceCertification.result,
      certificationState: "PASS" as const,
      integrityCertified: true,
      strengthCertified: true,
      propagationCertified: true,
      replayCertified: true,
      governanceCertified: true,
      observabilityCertified: true,
      recoverabilityCertified: true,
      disruptionToleranceCertified: true,
    },
  };

  return Object.freeze({
    request: buildDependencyRiskFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-alpha"],
      riskScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    dependencyFoundation,
    dependencyReplay,
    dependencyCertification,
    trustFoundation,
    trustReplay,
    trustCertification,
    driftFoundation: drift.foundation,
    driftReplay: drift.replay,
    driftCertification: drift.certification,
    resilienceFoundation: stableResilienceFoundation,
    resilienceReplay: stableResilienceReplay,
    resilienceCertification: stableResilienceCertification,
    impactCertification: {
      ...cachedImpactCertification,
      result: {
        ...cachedImpactCertification.result,
        certificationState: "PASS" as const,
        governanceCertified: true,
      },
    },
    portfolioCertification: {
      ...cachedPortfolioCertification,
      result: {
        ...cachedPortfolioCertification.result,
        certificationState: "PASS" as const,
        governanceCertified: true,
      },
    },
    recommendations: selectedRecommendations,
    ...overrides,
  } satisfies DependencyRiskFoundationInput);
}

describe("dependencyRiskFoundation", () => {
  it("is deterministic and reproduces dependency risk graph hashes", () => {
    const input = lowRiskInput();
    const first = sealDependencyRiskFoundation(input);
    const second = sealDependencyRiskFoundation(input);
    expect(first).toEqual(second);
    expect(first.result.dependencyRiskGraphHash).toHaveLength(64);
  });

  it("keeps dependency risk ordering deterministic", () => {
    const input = lowRiskInput();
    const reversed = lowRiskInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDependencyRiskFoundation(reversed)).toEqual(sealDependencyRiskFoundation(input));
    expect(createDependencyRiskEvidencePath(reversed, sealDependencyRiskFoundation(reversed).risks)).toEqual(
      createDependencyRiskEvidencePath(input, sealDependencyRiskFoundation(input).risks),
    );
  });

  it("builds concentration, failure, propagation, fragility, availability, replay, governance, trust, drift, and resilience risks reproducibly", () => {
    const sealed = sealDependencyRiskFoundation(lowRiskInput());
    const types = new Set(sealed.risks.map((risk) => risk.riskType));
    expect(types.has("DEPENDENCY_CONCENTRATION_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_FAILURE_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_PROPAGATION_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_FRAGILITY_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_AVAILABILITY_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_REPLAY_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_GOVERNANCE_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_TRUST_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_DRIFT_RISK")).toBe(true);
    expect(types.has("DEPENDENCY_RESILIENCE_RISK")).toBe(true);
  });

  it("reproduces LOW, MODERATE, HIGH, CRITICAL, and UNKNOWN states", () => {
    const low = sealDependencyRiskFoundation(lowRiskInput());
    const moderate = sealDependencyRiskFoundation(lowRiskInput({
      trustFoundation: {
        ...lowRiskInput().trustFoundation,
        result: { ...lowRiskInput().trustFoundation.result, trustState: "CONDITIONALLY_TRUSTED" as const },
        trusts: Object.freeze(lowRiskInput().trustFoundation.trusts.map((trust) => ({ ...trust, trustState: "CONDITIONALLY_TRUSTED" as const }))),
      },
    }));
    const high = sealDependencyRiskFoundation(lowRiskInput({
      dependencyReplay: {
        ...lowRiskInput().dependencyReplay,
        result: { ...lowRiskInput().dependencyReplay.result, replayState: "LIMITED" as const },
      },
    }));
    const critical = sealDependencyRiskFoundation(lowRiskInput({
      dependencyCertification: {
        ...lowRiskInput().dependencyCertification,
        result: { ...lowRiskInput().dependencyCertification.result, certificationState: "FAIL" as const, governanceCertified: false },
      },
    }));
    const unknown = sealDependencyRiskFoundation(lowRiskInput({
      dependencyFoundation: {
        ...lowRiskInput().dependencyFoundation,
        result: { ...lowRiskInput().dependencyFoundation.result, dependencyState: "OBSERVE" as const },
        evidencePath: {
          ...lowRiskInput().dependencyFoundation.evidencePath,
          dependencyReferences: Object.freeze([]),
        },
      },
    }));

    expect(low.result.dependencyRiskState).toBe("LOW");
    expect(moderate.result.dependencyRiskState).toBe("MODERATE");
    expect(high.result.dependencyRiskState).toBe("HIGH");
    expect(critical.result.dependencyRiskState).toBe("CRITICAL");
    expect(unknown.result.dependencyRiskState).toBe("UNKNOWN");
  });

  it("blocks cross-tenant dependency risk and ownership mismatches", () => {
    const base = lowRiskInput();
    const crossTenant = sealDependencyRiskFoundation({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
      ]),
    });
    const ownershipMismatch = sealDependencyRiskFoundation({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
      ]),
    });

    expect(crossTenant.result.dependencyRiskState).toBe("CRITICAL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_DEPENDENCY_RISK_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, mutation, workflow routing, prioritization, ranking, approval, remediation, and authority expansion", () => {
    const base = lowRiskInput();
    expect(sealDependencyRiskFoundation({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDependencyRiskFoundation({ ...base, dependencyRiskMutationAttempted: true }).validation.reasonCodes).toContain("DEPENDENCY_RISK_MUTATION_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, remediationRequested: true }).validation.reasonCodes).toContain("REMEDIATION_DETECTED");
    expect(sealDependencyRiskFoundation({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds dependency risk counts at declared limits", () => {
    const base = lowRiskInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `replay:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const failed = sealDependencyRiskFoundation({
      ...base,
      dependencyFoundation: {
        ...base.dependencyFoundation,
        evidencePath: {
          ...base.dependencyFoundation.evidencePath,
          replayReferences: overflow,
        },
      },
    });
    expect(failed.result.dependencyRiskState).toBe("CRITICAL");
    expect(failed.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
  });
});
