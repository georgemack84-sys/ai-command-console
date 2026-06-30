import { describe, expect, it } from "vitest";
import {
  sealDependencyCertification,
  sealDependencyObservability,
} from "@/services/recommendation-dependency";
import {
  buildDependencyRiskAnalysisRequest,
  buildDependencyRiskObservabilityRequest,
  buildDependencyRiskReplayRequest,
  sealDependencyRiskAnalysis,
  sealDependencyRiskFoundation,
  sealDependencyRiskObservability,
  sealDependencyRiskReplay,
  createDependencyRiskReplayEvidencePath,
  type DependencyRiskAnalysisInput,
  type DependencyRiskFoundationInput,
  type DependencyRiskObservabilityInput,
  type DependencyRiskReplayInput,
} from "@/services/recommendation-dependency-risk";
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
const cachedImpactFoundation = cachedImpactInput.foundation;
const cachedImpactAnalysis = cachedImpactInput.analysis;
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
    request: {
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-alpha"],
      riskScope: "FULL",
      graphVersion: "decision-graph/v1",
    },
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
        replayCertified: true,
        propagationCertified: true,
        integrityCertified: true,
      },
    },
    portfolioCertification: {
      ...cachedPortfolioCertification,
      result: {
        ...cachedPortfolioCertification.result,
        certificationState: "PASS" as const,
        governanceCertified: true,
        replayCertified: true,
        integrityCertified: true,
      },
    },
    recommendations: selectedRecommendations,
    ...overrides,
  } satisfies DependencyRiskFoundationInput);
}

function dependencyRiskAnalysisInput(overrides: Partial<DependencyRiskAnalysisInput> = {}): DependencyRiskAnalysisInput {
  const foundationInput = lowRiskInput();
  const foundation = overrides.foundation ?? sealDependencyRiskFoundation(foundationInput);
  const driftAnalysis = overrides.driftAnalysis ?? sealDriftAnalysis({
    ...cachedDriftAnalysisInput,
    foundation: overrides.driftFoundation ?? foundationInput.driftFoundation,
    impactFoundation: cachedImpactFoundation,
    impactAnalysis: cachedImpactAnalysis,
    impactReplay: cachedImpactInput.replay,
    impactCertification: foundationInput.impactCertification,
    dependencyFoundation: foundationInput.dependencyFoundation,
    dependencyAnalysis: cachedDependencyInput.analysis,
    dependencyReplay: foundationInput.dependencyReplay,
    dependencyCertification: foundationInput.dependencyCertification,
    portfolio: cachedDriftAnalysisInput.portfolio,
    relationshipAnalysis: cachedDriftAnalysisInput.relationshipAnalysis,
    portfolioReplay: cachedDriftAnalysisInput.portfolioReplay,
    portfolioCertification: foundationInput.portfolioCertification,
    recommendations: foundationInput.recommendations,
  } satisfies DriftAnalysisInput);
  const trustAnalysis = overrides.trustAnalysis ?? sealTrustAnalysis(trustAnalysisInput({
    foundation: overrides.trustFoundation ?? foundationInput.trustFoundation,
    driftReplay: overrides.driftReplay ?? foundationInput.driftReplay,
    driftCertification: overrides.driftCertification ?? foundationInput.driftCertification,
    recommendations: overrides.recommendations ?? foundationInput.recommendations,
  }));
  const resilienceAnalysis = overrides.resilienceAnalysis ?? sealResilienceAnalysis(resilienceAnalysisInput({
    foundation: overrides.resilienceFoundation ?? foundationInput.resilienceFoundation,
    trustReplay: overrides.trustReplay ?? foundationInput.trustReplay,
    trustCertification: overrides.trustCertification ?? foundationInput.trustCertification,
    driftReplay: overrides.driftReplay ?? foundationInput.driftReplay,
    driftCertification: overrides.driftCertification ?? foundationInput.driftCertification,
    recommendations: overrides.recommendations ?? foundationInput.recommendations,
  }));

  return Object.freeze({
    request: buildDependencyRiskAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-alpha"],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    dependencyFoundation: foundationInput.dependencyFoundation,
    dependencyAnalysis: cachedDependencyInput.analysis,
    dependencyReplay: foundationInput.dependencyReplay,
    dependencyCertification: foundationInput.dependencyCertification,
    trustFoundation: foundationInput.trustFoundation,
    trustAnalysis,
    trustReplay: foundationInput.trustReplay,
    trustCertification: foundationInput.trustCertification,
    driftFoundation: foundationInput.driftFoundation,
    driftAnalysis,
    driftReplay: foundationInput.driftReplay,
    driftCertification: foundationInput.driftCertification,
    resilienceFoundation: foundationInput.resilienceFoundation,
    resilienceAnalysis,
    resilienceReplay: foundationInput.resilienceReplay,
    resilienceCertification: foundationInput.resilienceCertification,
    impactFoundation: cachedImpactFoundation,
    impactAnalysis: cachedImpactAnalysis,
    impactReplay: cachedImpactInput.replay,
    impactCertification: foundationInput.impactCertification,
    portfolio: cachedDriftAnalysisInput.portfolio,
    relationshipAnalysis: cachedDriftAnalysisInput.relationshipAnalysis,
    portfolioReplay: cachedDriftAnalysisInput.portfolioReplay,
    portfolioCertification: foundationInput.portfolioCertification,
    recommendations: foundationInput.recommendations,
    ...overrides,
  } satisfies DependencyRiskAnalysisInput);
}

function dependencyRiskObservabilityInput(overrides: Partial<DependencyRiskObservabilityInput> = {}): DependencyRiskObservabilityInput {
  const analysisInput = dependencyRiskAnalysisInput();
  const foundation = overrides.foundation ?? analysisInput.foundation;
  const analysis = overrides.analysis ?? sealDependencyRiskAnalysis(analysisInput);
  return Object.freeze({
    request: buildDependencyRiskObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    dependencyReplay: overrides.dependencyReplay ?? analysisInput.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? analysisInput.dependencyCertification,
    trustReplay: overrides.trustReplay ?? analysisInput.trustReplay,
    trustCertification: overrides.trustCertification ?? analysisInput.trustCertification,
    driftReplay: overrides.driftReplay ?? analysisInput.driftReplay,
    driftCertification: overrides.driftCertification ?? analysisInput.driftCertification,
    resilienceReplay: overrides.resilienceReplay ?? analysisInput.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? analysisInput.resilienceCertification,
    impactCertification: overrides.impactCertification ?? analysisInput.impactCertification,
    portfolioCertification: overrides.portfolioCertification ?? analysisInput.portfolioCertification,
    recommendations: overrides.recommendations ?? analysisInput.recommendations,
    ...overrides,
  } satisfies DependencyRiskObservabilityInput);
}

function dependencyRiskReplayInput(overrides: Partial<DependencyRiskReplayInput> = {}): DependencyRiskReplayInput {
  const observabilityInput = dependencyRiskObservabilityInput();
  const foundation = overrides.foundation ?? observabilityInput.foundation;
  const analysis = overrides.analysis ?? observabilityInput.analysis;
  const observability = overrides.observability ?? sealDependencyRiskObservability({
    ...observabilityInput,
    foundation,
    analysis,
    dependencyReplay: overrides.dependencyReplay ?? observabilityInput.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? observabilityInput.dependencyCertification,
    trustReplay: overrides.trustReplay ?? observabilityInput.trustReplay,
    trustCertification: overrides.trustCertification ?? observabilityInput.trustCertification,
    driftReplay: overrides.driftReplay ?? observabilityInput.driftReplay,
    driftCertification: overrides.driftCertification ?? observabilityInput.driftCertification,
    resilienceReplay: overrides.resilienceReplay ?? observabilityInput.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? observabilityInput.resilienceCertification,
    impactCertification: overrides.impactCertification ?? observabilityInput.impactCertification,
    portfolioCertification: overrides.portfolioCertification ?? observabilityInput.portfolioCertification,
    recommendations: overrides.recommendations ?? observabilityInput.recommendations,
  });

  return Object.freeze({
    request: buildDependencyRiskReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "dependency-risk-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    dependencyReplay: overrides.dependencyReplay ?? observabilityInput.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? observabilityInput.dependencyCertification,
    trustReplay: overrides.trustReplay ?? observabilityInput.trustReplay,
    trustCertification: overrides.trustCertification ?? observabilityInput.trustCertification,
    driftReplay: overrides.driftReplay ?? observabilityInput.driftReplay,
    driftCertification: overrides.driftCertification ?? observabilityInput.driftCertification,
    resilienceReplay: overrides.resilienceReplay ?? observabilityInput.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? observabilityInput.resilienceCertification,
    impactCertification: overrides.impactCertification ?? observabilityInput.impactCertification,
    portfolioCertification: overrides.portfolioCertification ?? observabilityInput.portfolioCertification,
    recommendations: overrides.recommendations ?? observabilityInput.recommendations,
    ...overrides,
  } satisfies DependencyRiskReplayInput);
}

describe("dependencyRiskReplayFramework", () => {
  it("is deterministic and produces stable replay hashes", () => {
    const input = dependencyRiskReplayInput();
    const first = sealDependencyRiskReplay(input);
    const second = sealDependencyRiskReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps replay evidence ordering deterministic", () => {
    const input = dependencyRiskReplayInput();
    const reversed = dependencyRiskReplayInput({
      request: buildDependencyRiskReplayRequest({
        tenantId: "tenant-alpha",
        replayScope: "FULL",
        replayVersion: "dependency-risk-replay/v1",
        graphVersion: "decision-graph/v1",
      }),
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDependencyRiskReplay(reversed)).toEqual(sealDependencyRiskReplay(input));
    expect(createDependencyRiskReplayEvidencePath(reversed)).toEqual(createDependencyRiskReplayEvidencePath(input));
  });

  it("reconstructs risk, severity, propagation, conflicts, governance, and observability reproducibly", () => {
    const first = sealDependencyRiskReplay(dependencyRiskReplayInput());
    const second = sealDependencyRiskReplay(dependencyRiskReplayInput());
    expect(first.result.riskReconstructed).toBe(true);
    expect(first.result.severityReconstructed).toBe(true);
    expect(first.result.propagationReconstructed).toBe(true);
    expect(first.result.conflictsReconstructed).toBe(true);
    expect(first.result.governanceReconstructed).toBe(true);
    expect(first.validation.observabilityReconstructed).toBe(true);
    expect(first.evidencePath.propagationReferences).toEqual(second.evidencePath.propagationReferences);
    expect(first.evidencePath.conflictReferences).toEqual(second.evidencePath.conflictReferences);
    expect(first.evidencePath.observabilityReferences).toEqual(second.evidencePath.observabilityReferences);
  });

  it("surfaces replay artifact degradation as LIMITED", () => {
    const base = dependencyRiskReplayInput();
    const limited = sealDependencyRiskReplay({
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
    const base = dependencyRiskReplayInput();
    const replayMismatch = sealDependencyRiskReplay({
      ...base,
      dependencyReplay: {
        ...base.dependencyReplay,
        result: {
          ...base.dependencyReplay.result,
          replayState: "ESCALATED" as const,
        },
      },
    });
    const lineageBroken = sealDependencyRiskReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          lineageReferences: Object.freeze([]),
        },
      },
    });
    const propagationMismatch = sealDependencyRiskReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          propagationReferences: Object.freeze([]),
        },
      },
    });
    const governanceDegraded = sealDependencyRiskReplay({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          governanceReferences: Object.freeze([]),
        },
      },
    });
    const observabilityBroken = sealDependencyRiskReplay({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          auditVisible: false,
        },
        evidencePath: {
          ...base.observability.evidencePath,
          auditReferences: Object.freeze([]),
        },
      },
    });
    const governanceCorrupted = sealDependencyRiskReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          governanceCertification: {
            ...base.recommendations[0].governanceCertification,
            result: { ...base.recommendations[0].governanceCertification.result, certificationState: "FAIL" as const },
          },
        },
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
    const base = dependencyRiskReplayInput();
    const crossTenant = sealDependencyRiskReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
      ]),
    });
    const ownershipMismatch = sealDependencyRiskReplay({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
      ]),
    });
    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_REPLAY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealDependencyRiskReplay({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDependencyRiskReplay({ ...base, replayMutationAttempted: true }).validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
    expect(sealDependencyRiskReplay({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDependencyRiskReplay({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDependencyRiskReplay({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealDependencyRiskReplay({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDependencyRiskReplay({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("bounds replay and lineage counts at the declared limits", () => {
    const base = dependencyRiskReplayInput();
    const replayOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `replay:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const lineageOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `lineage:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const limited = sealDependencyRiskReplay({
      ...base,
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
