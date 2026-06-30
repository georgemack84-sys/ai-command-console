import { describe, expect, it } from "vitest";
import {
  sealDependencyCertification,
  sealDependencyObservability,
} from "@/services/recommendation-dependency";
import {
  buildDependencyRiskAnalysisRequest,
  buildDependencyRiskCertificationRequest,
  buildDependencyRiskObservabilityRequest,
  buildDependencyRiskReplayRequest,
  sealDependencyRiskAnalysis,
  sealDependencyRiskCertification,
  sealDependencyRiskFoundation,
  sealDependencyRiskObservability,
  sealDependencyRiskReplay,
  type DependencyRiskAnalysisInput,
  type DependencyRiskCertificationInput,
  type DependencyRiskFoundationInput,
  type DependencyRiskObservabilityInput,
  type DependencyRiskReplayInput,
} from "@/services/recommendation-dependency-risk";
import {
  buildRecommendationOpportunityFoundationRequest,
  buildOpportunityAnalysisRequest,
  buildOpportunityObservabilityRequest,
  buildOpportunityCertificationRequest,
  buildOpportunityReplayRequest,
  createOpportunityCertificationEvidencePath,
  sealOpportunityAnalysis,
  sealOpportunityCertification,
  sealOpportunityObservability,
  sealOpportunityReplay,
  sealRecommendationOpportunityFoundation,
  type OpportunityCertificationInput,
  type OpportunityReplayInput,
  type OpportunityObservabilityInput,
  type OpportunityAnalysisInput,
  type RecommendationOpportunityFoundationInput,
} from "@/services/recommendation-opportunity";
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

function dependencyRiskCertificationInput(overrides: Partial<DependencyRiskCertificationInput> = {}): DependencyRiskCertificationInput {
  const replayInput = dependencyRiskReplayInput();
  const foundation = overrides.foundation ?? replayInput.foundation;
  const analysis = overrides.analysis ?? replayInput.analysis;
  const observability = overrides.observability ?? replayInput.observability;
  const replay = overrides.replay ?? sealDependencyRiskReplay({
    ...replayInput,
    foundation,
    analysis,
    observability,
    dependencyReplay: replayInput.dependencyReplay,
    dependencyCertification: replayInput.dependencyCertification,
    trustReplay: replayInput.trustReplay,
    trustCertification: replayInput.trustCertification,
    driftReplay: replayInput.driftReplay,
    driftCertification: replayInput.driftCertification,
    resilienceReplay: replayInput.resilienceReplay,
    resilienceCertification: replayInput.resilienceCertification,
    impactCertification: replayInput.impactCertification,
    portfolioCertification: replayInput.portfolioCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
  });

  return Object.freeze({
    request: buildDependencyRiskCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    replay,
    dependencyCertification: overrides.dependencyCertification ?? replayInput.dependencyCertification,
    trustCertification: overrides.trustCertification ?? replayInput.trustCertification,
    driftCertification: overrides.driftCertification ?? replayInput.driftCertification,
    resilienceCertification: overrides.resilienceCertification ?? replayInput.resilienceCertification,
    impactCertification: overrides.impactCertification ?? replayInput.impactCertification,
    portfolioCertification: overrides.portfolioCertification ?? replayInput.portfolioCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
    ...overrides,
  } satisfies DependencyRiskCertificationInput);
}

function recommendationOpportunityInput(
  overrides: Partial<RecommendationOpportunityFoundationInput> = {},
): RecommendationOpportunityFoundationInput {
  const base = lowRiskInput();
  const dependencyRiskFoundation = overrides.dependencyRiskFoundation ?? sealDependencyRiskFoundation(base);
  const dependencyRiskReplay = overrides.dependencyRiskReplay ?? sealDependencyRiskReplay(dependencyRiskReplayInput({
    foundation: dependencyRiskFoundation,
  }));
  const dependencyRiskCertification = overrides.dependencyRiskCertification ?? sealDependencyRiskCertification(dependencyRiskCertificationInput({
    foundation: dependencyRiskFoundation,
    replay: dependencyRiskReplay,
  }));
  const recommendations = overrides.recommendations ?? cachedStableRecommendations;
  const recommendationIds = [...new Set(recommendations.map((bundle) => bundle.ledger.entry.recommendationId))];

  return Object.freeze({
    request: overrides.request ?? buildRecommendationOpportunityFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds,
      opportunityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    dependencyRiskFoundation,
    dependencyRiskReplay,
    dependencyRiskCertification,
    dependencyFoundation: overrides.dependencyFoundation ?? base.dependencyFoundation,
    dependencyReplay: overrides.dependencyReplay ?? base.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? base.dependencyCertification,
    impactFoundation: overrides.impactFoundation ?? cachedImpactInput.foundation,
    impactReplay: overrides.impactReplay ?? cachedImpactInput.replay,
    impactCertification: overrides.impactCertification ?? base.impactCertification,
    trustFoundation: overrides.trustFoundation ?? base.trustFoundation,
    trustReplay: overrides.trustReplay ?? base.trustReplay,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftFoundation: overrides.driftFoundation ?? base.driftFoundation,
    driftReplay: overrides.driftReplay ?? base.driftReplay,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    resilienceFoundation: overrides.resilienceFoundation ?? base.resilienceFoundation,
    resilienceReplay: overrides.resilienceReplay ?? base.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? base.resilienceCertification,
    portfolio: overrides.portfolio ?? cachedDriftAnalysisInput.portfolio,
    relationshipAnalysis: overrides.relationshipAnalysis ?? cachedDriftAnalysisInput.relationshipAnalysis,
    portfolioReplay: overrides.portfolioReplay ?? cachedDriftAnalysisInput.portfolioReplay,
    portfolioCertification: overrides.portfolioCertification ?? base.portfolioCertification,
    recommendations,
    opportunityMutationAttempted: overrides.opportunityMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    recommendationScoringRequested: overrides.recommendationScoringRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies RecommendationOpportunityFoundationInput);
}

function opportunityAnalysisInput(
  overrides: Partial<OpportunityAnalysisInput> = {},
): OpportunityAnalysisInput {
  const base = recommendationOpportunityInput();
  const foundation = overrides.foundation ?? sealRecommendationOpportunityFoundation(base);

  return Object.freeze({
    request: overrides.request ?? buildOpportunityAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: [...base.request.recommendationIds],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
      foundation,
      dependencyRiskFoundation: overrides.dependencyRiskFoundation ?? base.dependencyRiskFoundation,
      dependencyRiskReplay: overrides.dependencyRiskReplay ?? base.dependencyRiskReplay,
      dependencyRiskCertification: overrides.dependencyRiskCertification ?? base.dependencyRiskCertification,
      dependencyFoundation: overrides.dependencyFoundation ?? base.dependencyFoundation,
      dependencyReplay: overrides.dependencyReplay ?? base.dependencyReplay,
      dependencyCertification: overrides.dependencyCertification ?? base.dependencyCertification,
      impactFoundation: overrides.impactFoundation ?? base.impactFoundation,
      impactReplay: overrides.impactReplay ?? base.impactReplay,
      impactCertification: overrides.impactCertification ?? base.impactCertification,
      trustFoundation: overrides.trustFoundation ?? base.trustFoundation,
      trustReplay: overrides.trustReplay ?? base.trustReplay,
      trustCertification: overrides.trustCertification ?? base.trustCertification,
      driftFoundation: overrides.driftFoundation ?? base.driftFoundation,
      driftReplay: overrides.driftReplay ?? base.driftReplay,
      driftCertification: overrides.driftCertification ?? base.driftCertification,
      resilienceFoundation: overrides.resilienceFoundation ?? base.resilienceFoundation,
      resilienceReplay: overrides.resilienceReplay ?? base.resilienceReplay,
      resilienceCertification: overrides.resilienceCertification ?? base.resilienceCertification,
      portfolio: overrides.portfolio ?? base.portfolio,
      relationshipAnalysis: overrides.relationshipAnalysis ?? base.relationshipAnalysis,
      portfolioReplay: overrides.portfolioReplay ?? base.portfolioReplay,
      portfolioCertification: overrides.portfolioCertification ?? base.portfolioCertification,
      recommendations: overrides.recommendations ?? base.recommendations,
      analysisMutationAttempted: overrides.analysisMutationAttempted,
      executionRequested: overrides.executionRequested,
      workflowRoutingRequested: overrides.workflowRoutingRequested,
      prioritizationRequested: overrides.prioritizationRequested,
      recommendationRankingRequested: overrides.recommendationRankingRequested,
      approvalRequested: overrides.approvalRequested,
      recommendationScoringRequested: overrides.recommendationScoringRequested,
      resourceAllocationRequested: overrides.resourceAllocationRequested,
      authorityExpansionDetected: overrides.authorityExpansionDetected,
    } satisfies OpportunityAnalysisInput);
}

function opportunityObservabilityInput(
  overrides: Partial<OpportunityObservabilityInput> = {},
): OpportunityObservabilityInput {
  const analysisBase = opportunityAnalysisInput();
  const foundation = overrides.foundation ?? analysisBase.foundation;
  const analysis = overrides.analysis ?? sealOpportunityAnalysis(analysisBase);

  return Object.freeze({
    request: overrides.request ?? buildOpportunityObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    dependencyRiskFoundation: overrides.dependencyRiskFoundation ?? analysisBase.dependencyRiskFoundation,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? analysisBase.dependencyRiskCertification,
    dependencyFoundation: overrides.dependencyFoundation ?? analysisBase.dependencyFoundation,
    dependencyCertification: overrides.dependencyCertification ?? analysisBase.dependencyCertification,
    impactFoundation: overrides.impactFoundation ?? analysisBase.impactFoundation,
    impactCertification: overrides.impactCertification ?? analysisBase.impactCertification,
    trustFoundation: overrides.trustFoundation ?? analysisBase.trustFoundation,
    trustCertification: overrides.trustCertification ?? analysisBase.trustCertification,
    driftFoundation: overrides.driftFoundation ?? analysisBase.driftFoundation,
    driftCertification: overrides.driftCertification ?? analysisBase.driftCertification,
    resilienceFoundation: overrides.resilienceFoundation ?? analysisBase.resilienceFoundation,
    resilienceCertification: overrides.resilienceCertification ?? analysisBase.resilienceCertification,
    portfolio: overrides.portfolio ?? analysisBase.portfolio,
    portfolioCertification: overrides.portfolioCertification ?? analysisBase.portfolioCertification,
    recommendations: overrides.recommendations ?? analysisBase.recommendations,
    observabilityMutationAttempted: overrides.observabilityMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies OpportunityObservabilityInput);
}

function opportunityReplayInput(
  overrides: Partial<OpportunityReplayInput> = {},
): OpportunityReplayInput {
  const observabilityBase = opportunityObservabilityInput();
  const foundation = overrides.foundation ?? observabilityBase.foundation;
  const analysis = overrides.analysis ?? sealOpportunityAnalysis(opportunityAnalysisInput({
    foundation,
    recommendations: overrides.recommendations ?? observabilityBase.recommendations,
  }));
  const observability = overrides.observability ?? sealOpportunityObservability({
    ...observabilityBase,
    foundation,
    analysis,
    recommendations: overrides.recommendations ?? observabilityBase.recommendations,
  });

  return Object.freeze({
    request: overrides.request ?? buildOpportunityReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "opportunity-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    dependencyRiskFoundation: overrides.dependencyRiskFoundation ?? observabilityBase.dependencyRiskFoundation,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? observabilityBase.dependencyRiskCertification,
    dependencyFoundation: overrides.dependencyFoundation ?? observabilityBase.dependencyFoundation,
    dependencyCertification: overrides.dependencyCertification ?? observabilityBase.dependencyCertification,
    impactFoundation: overrides.impactFoundation ?? observabilityBase.impactFoundation,
    impactCertification: overrides.impactCertification ?? observabilityBase.impactCertification,
    trustFoundation: overrides.trustFoundation ?? observabilityBase.trustFoundation,
    trustCertification: overrides.trustCertification ?? observabilityBase.trustCertification,
    driftFoundation: overrides.driftFoundation ?? observabilityBase.driftFoundation,
    driftCertification: overrides.driftCertification ?? observabilityBase.driftCertification,
    resilienceFoundation: overrides.resilienceFoundation ?? observabilityBase.resilienceFoundation,
    resilienceCertification: overrides.resilienceCertification ?? observabilityBase.resilienceCertification,
    portfolio: overrides.portfolio ?? observabilityBase.portfolio,
    portfolioCertification: overrides.portfolioCertification ?? observabilityBase.portfolioCertification,
    recommendations: overrides.recommendations ?? observabilityBase.recommendations,
    replayMutationAttempted: overrides.replayMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies OpportunityReplayInput);
}

function certifiableInput(
  overrides: Partial<OpportunityCertificationInput> = {},
): OpportunityCertificationInput {
  const replayInput = opportunityReplayInput();
  const replay = overrides.replay ?? sealOpportunityReplay(replayInput);

  return Object.freeze({
    request: buildOpportunityCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: overrides.foundation ?? replayInput.foundation,
    analysis: overrides.analysis ?? replayInput.analysis,
    observability: overrides.observability ?? replayInput.observability,
    replay,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? replayInput.dependencyRiskCertification,
    dependencyCertification: overrides.dependencyCertification ?? replayInput.dependencyCertification,
    impactCertification: overrides.impactCertification ?? replayInput.impactCertification,
    trustCertification: overrides.trustCertification ?? replayInput.trustCertification,
    driftCertification: overrides.driftCertification ?? replayInput.driftCertification,
    resilienceCertification: overrides.resilienceCertification ?? replayInput.resilienceCertification,
    portfolioCertification: overrides.portfolioCertification ?? replayInput.portfolioCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
    ...overrides,
  } satisfies OpportunityCertificationInput);
}

describe("opportunityCertificationGate", () => {
  it("certifies deterministically with stable hashes", () => {
    const input = certifiableInput();
    const first = sealOpportunityCertification(input);
    const second = sealOpportunityCertification(input);

    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps certification evidence ordering deterministic", () => {
    const input = certifiableInput();
    const reversed = certifiableInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealOpportunityCertification(reversed)).toEqual(sealOpportunityCertification(input));
    expect(createOpportunityCertificationEvidencePath(reversed)).toEqual(createOpportunityCertificationEvidencePath(input));
  }, 15000);

  it("preserves integrity, strength, propagation, replay, governance, observability, evidence, and lineage certification", () => {
    const certified = sealOpportunityCertification(certifiableInput({
      request: buildOpportunityCertificationRequest({
        tenantId: "tenant-alpha",
        certificationScope: "STRENGTH",
        graphVersion: "decision-graph/v1",
      }),
    }));
    expect(certified.evidencePath.strengthReferences.some((ref) => ref.endsWith(":STRONG") || ref.endsWith(":MODERATE") || ref.endsWith(":WEAK") || ref.endsWith(":CONSTRAINED") || ref.endsWith(":UNSUPPORTED"))).toBe(true);
    expect(certified.result.integrityCertified).toBe(true);
    expect(certified.result.strengthCertified).toBe(true);
    expect(certified.result.propagationCertified).toBe(true);
    expect(certified.result.replayCertified).toBe(true);
    expect(certified.result.governanceCertified).toBe(true);
    expect(certified.result.observabilityCertified).toBe(true);
    expect(certified.result.evidenceCertified).toBe(true);
    expect(certified.validation.lineageCertified).toBe(true);
  });

  it("returns CONDITIONAL_PASS for replay degradation, observability incompleteness, and evidence degradation", () => {
    const base = certifiableInput();
    const replayLimited = sealOpportunityCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "LIMITED",
        },
      },
    });
    const observabilityLimited = sealOpportunityCertification({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          observabilityState: "LIMITED",
          opportunityAuditVisible: false,
        },
      },
    });
    const evidenceLimited = sealOpportunityCertification({
      ...base,
      replay: {
        ...base.replay,
        evidencePath: {
          ...base.replay.evidencePath,
          auditReferences: Object.freeze([]),
        },
      },
    });

    expect(replayLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityLimited.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
    expect(evidenceLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(evidenceLimited.validation.reasonCodes).toContain("EVIDENCE_DEGRADED");
  });

  it("fails on corruption, integrity breaks, lineage breaks, and evidence continuity breaks", () => {
    const base = certifiableInput();
    const replayCorrupted = sealOpportunityCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "ESCALATED",
        },
      },
    });
    const integrityBroken = sealOpportunityCertification({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          opportunityReferences: Object.freeze([]),
        },
      },
    });
    const lineageBroken = sealOpportunityCertification({
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
    const evidenceBroken = sealOpportunityCertification({
      ...base,
      replay: {
        ...base.replay,
        evidencePath: {
          ...base.replay.evidencePath,
          evidenceHashes: Object.freeze([]),
        },
      },
    });

    expect(replayCorrupted.result.certificationState).toBe("FAIL");
    expect(replayCorrupted.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(integrityBroken.result.certificationState).toBe("FAIL");
    expect(integrityBroken.validation.reasonCodes).toContain("INTEGRITY_BROKEN");
    expect(lineageBroken.result.certificationState).toBe("FAIL");
    expect(lineageBroken.validation.reasonCodes).toContain("LINEAGE_CORRUPTION_DETECTED");
    expect(evidenceBroken.result.certificationState).toBe("FAIL");
    expect(evidenceBroken.validation.reasonCodes).toContain("EVIDENCE_CONTINUITY_BROKEN");
  });

  it("blocks cross-tenant certification, ownership mismatches, execution, mutation, routing, prioritization, ranking, approval, resource allocation, and authority expansion", () => {
    const base = certifiableInput();
    const crossTenant = sealOpportunityCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" } },
        ...base.recommendations.slice(1),
      ]),
    });
    const ownershipMismatch = sealOpportunityCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" } },
        ...base.recommendations.slice(1),
      ]),
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(sealOpportunityCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealOpportunityCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealOpportunityCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealOpportunityCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealOpportunityCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealOpportunityCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealOpportunityCertification({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealOpportunityCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("fails on governance corruption", () => {
    const base = certifiableInput();
    const brokenGovernance = sealOpportunityCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], governanceCertification: { ...base.recommendations[0].governanceCertification, result: { ...base.recommendations[0].governanceCertification.result, certificationState: "FAIL" as const } } },
        ...base.recommendations.slice(1),
      ]),
    });
    expect(brokenGovernance.result.certificationState).toBe("FAIL");
    expect(brokenGovernance.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
  });

  it("bounds propagation, replay, lineage, and evidence counts at declared limits", () => {
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
    const evidenceOverflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `evidence:${index.toString().padStart(5, "0")}`.padEnd(64, "e"),
    ));
    const limited = sealOpportunityCertification({
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
          evidenceHashes: evidenceOverflow,
        },
      },
    });

    expect(limited.result.certificationState).toBe("FAIL");
    expect(limited.validation.reasonCodes).toContain("PROPAGATION_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("LINEAGE_REFERENCE_LIMIT_EXCEEDED");
    expect(limited.validation.reasonCodes).toContain("EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  });
});
