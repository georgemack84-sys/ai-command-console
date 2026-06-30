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
import {
  buildConstraintAnalysisRequest,
  buildConstraintCertificationRequest,
  buildConstraintObservabilityRequest,
  buildConstraintReplayRequest,
  buildRecommendationConstraintFoundationRequest,
  sealConstraintAnalysis,
  sealConstraintCertification,
  sealConstraintObservability,
  sealConstraintReplay,
  sealRecommendationConstraintFoundation,
  type ConstraintAnalysisInput,
  type ConstraintCertificationInput,
  type ConstraintObservabilityInput,
  type ConstraintReplayInput,
  type RecommendationConstraintFoundationInput,
} from "@/services/recommendation-constraint";
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
  overrides: Partial<RecommendationConstraintFoundationInput> = {},
): RecommendationConstraintFoundationInput {
  const foundationBase = recommendationOpportunityInput();
  const replayInput = opportunityReplayInput();
  const opportunityReplay = overrides.opportunityReplay ?? sealOpportunityReplay(replayInput);
  const opportunityCertification = overrides.opportunityCertification ?? sealOpportunityCertification({
    request: buildOpportunityCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: replayInput.foundation,
    analysis: replayInput.analysis,
    observability: replayInput.observability,
    replay: opportunityReplay,
    dependencyRiskCertification: replayInput.dependencyRiskCertification,
    dependencyCertification: replayInput.dependencyCertification,
    impactCertification: replayInput.impactCertification,
    trustCertification: replayInput.trustCertification,
    driftCertification: replayInput.driftCertification,
    resilienceCertification: replayInput.resilienceCertification,
    portfolioCertification: replayInput.portfolioCertification,
    recommendations: replayInput.recommendations,
  } satisfies OpportunityCertificationInput);

  return Object.freeze({
    request: buildRecommendationConstraintFoundationRequest({
      tenantId: "tenant-alpha",
      recommendationIds: [...new Set(replayInput.recommendations.map((bundle) => bundle.ledger.entry.recommendationId))],
      constraintScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    opportunityFoundation: overrides.opportunityFoundation ?? replayInput.foundation,
    opportunityReplay,
    opportunityCertification,
    dependencyRiskFoundation: overrides.dependencyRiskFoundation ?? replayInput.dependencyRiskFoundation,
    dependencyRiskReplay: overrides.dependencyRiskReplay ?? foundationBase.dependencyRiskReplay,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? replayInput.dependencyRiskCertification,
    dependencyFoundation: overrides.dependencyFoundation ?? replayInput.dependencyFoundation,
    dependencyReplay: overrides.dependencyReplay ?? foundationBase.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? replayInput.dependencyCertification,
    impactFoundation: overrides.impactFoundation ?? replayInput.impactFoundation,
    impactReplay: overrides.impactReplay ?? foundationBase.impactReplay,
    impactCertification: overrides.impactCertification ?? replayInput.impactCertification,
    trustFoundation: overrides.trustFoundation ?? replayInput.trustFoundation,
    trustReplay: overrides.trustReplay ?? foundationBase.trustReplay,
    trustCertification: overrides.trustCertification ?? replayInput.trustCertification,
    driftFoundation: overrides.driftFoundation ?? replayInput.driftFoundation,
    driftReplay: overrides.driftReplay ?? foundationBase.driftReplay,
    driftCertification: overrides.driftCertification ?? replayInput.driftCertification,
    resilienceFoundation: overrides.resilienceFoundation ?? replayInput.resilienceFoundation,
    resilienceReplay: overrides.resilienceReplay ?? foundationBase.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? replayInput.resilienceCertification,
    portfolio: overrides.portfolio ?? replayInput.portfolio,
    relationshipAnalysis: overrides.relationshipAnalysis ?? foundationBase.relationshipAnalysis,
    portfolioReplay: overrides.portfolioReplay ?? foundationBase.portfolioReplay,
    portfolioCertification: overrides.portfolioCertification ?? replayInput.portfolioCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
    ...overrides,
  } satisfies RecommendationConstraintFoundationInput);
}

function constraintAnalysisInput(
  overrides: Partial<ConstraintAnalysisInput> = {},
): ConstraintAnalysisInput {
  const base = certifiableInput();
  const foundation = overrides.foundation ?? sealRecommendationConstraintFoundation(base);

  return Object.freeze({
    request: overrides.request ?? buildConstraintAnalysisRequest({
      tenantId: "tenant-alpha",
      recommendationIds: ["recommendation-alpha", "recommendation-beta"],
      analysisScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    opportunityFoundation: overrides.opportunityFoundation ?? base.opportunityFoundation,
    opportunityReplay: overrides.opportunityReplay ?? base.opportunityReplay,
    opportunityCertification: overrides.opportunityCertification ?? base.opportunityCertification,
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
  } satisfies ConstraintAnalysisInput);
}

function constraintObservabilityInput(
  overrides: Partial<ConstraintObservabilityInput> = {},
): ConstraintObservabilityInput {
  const base = constraintAnalysisInput();
  const analysis = overrides.analysis ?? sealConstraintAnalysis(base);

  return Object.freeze({
    request: overrides.request ?? buildConstraintObservabilityRequest({
      tenantId: "tenant-alpha",
      observabilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: overrides.foundation ?? base.foundation,
    analysis,
    opportunityFoundation: overrides.opportunityFoundation ?? base.opportunityFoundation,
    opportunityCertification: overrides.opportunityCertification ?? base.opportunityCertification,
    dependencyRiskFoundation: overrides.dependencyRiskFoundation ?? base.dependencyRiskFoundation,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? base.dependencyRiskCertification,
    dependencyFoundation: overrides.dependencyFoundation ?? base.dependencyFoundation,
    dependencyCertification: overrides.dependencyCertification ?? base.dependencyCertification,
    impactFoundation: overrides.impactFoundation ?? base.impactFoundation,
    impactCertification: overrides.impactCertification ?? base.impactCertification,
    trustFoundation: overrides.trustFoundation ?? base.trustFoundation,
    trustCertification: overrides.trustCertification ?? base.trustCertification,
    driftFoundation: overrides.driftFoundation ?? base.driftFoundation,
    driftCertification: overrides.driftCertification ?? base.driftCertification,
    resilienceFoundation: overrides.resilienceFoundation ?? base.resilienceFoundation,
    resilienceCertification: overrides.resilienceCertification ?? base.resilienceCertification,
    portfolio: overrides.portfolio ?? base.portfolio,
    portfolioCertification: overrides.portfolioCertification ?? base.portfolioCertification,
    recommendations: overrides.recommendations ?? base.recommendations,
    observabilityMutationAttempted: overrides.observabilityMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    recommendationScoringRequested: overrides.recommendationScoringRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies ConstraintObservabilityInput);
}

function constraintReplayInput(
  overrides: Partial<ConstraintReplayInput> = {},
): ConstraintReplayInput {
  const baseFoundation = certifiableInput();
  const baseAnalysis = constraintAnalysisInput();
  const observability = overrides.observability ?? sealConstraintObservability(constraintObservabilityInput());
  return Object.freeze({
    request: overrides.request ?? buildConstraintReplayRequest({
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      replayVersion: "constraint-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
    foundation: overrides.foundation ?? baseAnalysis.foundation,
    analysis: overrides.analysis ?? sealConstraintAnalysis(baseAnalysis),
    observability,
    opportunityReplay: overrides.opportunityReplay ?? baseFoundation.opportunityReplay,
    opportunityCertification: overrides.opportunityCertification ?? baseFoundation.opportunityCertification,
    dependencyRiskReplay: overrides.dependencyRiskReplay ?? baseFoundation.dependencyRiskReplay,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? baseFoundation.dependencyRiskCertification,
    dependencyReplay: overrides.dependencyReplay ?? baseFoundation.dependencyReplay,
    dependencyCertification: overrides.dependencyCertification ?? baseFoundation.dependencyCertification,
    impactReplay: overrides.impactReplay ?? baseFoundation.impactReplay,
    impactCertification: overrides.impactCertification ?? baseFoundation.impactCertification,
    trustReplay: overrides.trustReplay ?? baseFoundation.trustReplay,
    trustCertification: overrides.trustCertification ?? baseFoundation.trustCertification,
    driftReplay: overrides.driftReplay ?? baseFoundation.driftReplay,
    driftCertification: overrides.driftCertification ?? baseFoundation.driftCertification,
    resilienceReplay: overrides.resilienceReplay ?? baseFoundation.resilienceReplay,
    resilienceCertification: overrides.resilienceCertification ?? baseFoundation.resilienceCertification,
    portfolioReplay: overrides.portfolioReplay ?? baseFoundation.portfolioReplay,
    portfolioCertification: overrides.portfolioCertification ?? baseFoundation.portfolioCertification,
    recommendations: overrides.recommendations ?? baseAnalysis.recommendations,
    replayMutationAttempted: overrides.replayMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    recommendationScoringRequested: overrides.recommendationScoringRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies ConstraintReplayInput);
}

function constraintCertificationInput(
  overrides: Partial<ConstraintCertificationInput> = {},
): ConstraintCertificationInput {
  const foundationBase = certifiableInput();
  const analysisBase = constraintAnalysisInput();
  const replayInput = constraintReplayInput();
  const foundation = overrides.foundation ?? analysisBase.foundation;
  const analysis = overrides.analysis ?? sealConstraintAnalysis(analysisBase);
  const observability = overrides.observability ?? sealConstraintObservability(constraintObservabilityInput({
    foundation,
    analysis,
    recommendations: overrides.recommendations ?? analysisBase.recommendations,
  }));
  const replay = overrides.replay ?? sealConstraintReplay({
    ...replayInput,
    foundation,
    analysis,
    observability,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
  });

  return Object.freeze({
    request: overrides.request ?? buildConstraintCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation,
    analysis,
    observability,
    replay,
    opportunityCertification: overrides.opportunityCertification ?? foundationBase.opportunityCertification,
    dependencyRiskCertification: overrides.dependencyRiskCertification ?? foundationBase.dependencyRiskCertification,
    dependencyCertification: overrides.dependencyCertification ?? foundationBase.dependencyCertification,
    impactCertification: overrides.impactCertification ?? foundationBase.impactCertification,
    trustCertification: overrides.trustCertification ?? foundationBase.trustCertification,
    driftCertification: overrides.driftCertification ?? foundationBase.driftCertification,
    resilienceCertification: overrides.resilienceCertification ?? foundationBase.resilienceCertification,
    portfolioCertification: overrides.portfolioCertification ?? foundationBase.portfolioCertification,
    readinessCertification: overrides.readinessCertification ?? foundationBase.recommendations[0].readinessCertification,
    governanceCertification: overrides.governanceCertification ?? foundationBase.recommendations[0].governanceCertification,
    recommendationCertification: overrides.recommendationCertification ?? foundationBase.recommendations[0].certification,
    recommendationObservabilityCertification: overrides.recommendationObservabilityCertification ?? foundationBase.recommendations[0].observabilityCertification,
    recommendations: overrides.recommendations ?? replayInput.recommendations,
    certificationMutationAttempted: overrides.certificationMutationAttempted,
    executionRequested: overrides.executionRequested,
    workflowRoutingRequested: overrides.workflowRoutingRequested,
    prioritizationRequested: overrides.prioritizationRequested,
    recommendationRankingRequested: overrides.recommendationRankingRequested,
    approvalRequested: overrides.approvalRequested,
    recommendationScoringRequested: overrides.recommendationScoringRequested,
    resourceAllocationRequested: overrides.resourceAllocationRequested,
    authorityExpansionDetected: overrides.authorityExpansionDetected,
  } satisfies ConstraintCertificationInput);
}

describe("constraintCertificationGate", () => {
  it("is deterministic and produces stable certification hashes", () => {
    const input = constraintCertificationInput();
    const first = sealConstraintCertification(input);
    const second = sealConstraintCertification(input);

    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  }, 60000);

  it("keeps certification ordering deterministic when recommendations are reversed", () => {
    const base = certifiableInput();
    const reversedRecommendations = Object.freeze([...base.recommendations].reverse());
    const foundation = sealRecommendationConstraintFoundation({
      ...base,
      recommendations: reversedRecommendations,
    });
    const analysis = sealConstraintAnalysis(constraintAnalysisInput({
      recommendations: reversedRecommendations,
      foundation,
    }));
    const observability = sealConstraintObservability(constraintObservabilityInput({
      recommendations: reversedRecommendations,
      foundation,
      analysis,
    }));
    const replay = sealConstraintReplay(constraintReplayInput({
      recommendations: reversedRecommendations,
      foundation,
      analysis,
      observability,
    }));
    const first = sealConstraintCertification(constraintCertificationInput());
    const second = sealConstraintCertification(constraintCertificationInput({
      recommendations: reversedRecommendations,
      foundation,
      analysis,
      observability,
      replay,
      readinessCertification: reversedRecommendations[0].readinessCertification,
      governanceCertification: reversedRecommendations[0].governanceCertification,
      recommendationCertification: reversedRecommendations[0].certification,
      recommendationObservabilityCertification: reversedRecommendations[0].observabilityCertification,
    }));

    expect(second.evidencePath).toEqual(first.evidencePath);
    expect(second.result.certificationHash).toBe(first.result.certificationHash);
  }, 90000);

  it("certifies integrity, severities, propagation, replay, governance, observability, evidence, and tenant isolation on healthy inputs", () => {
    const sealed = sealConstraintCertification(constraintCertificationInput());

    expect(sealed.result.certificationState).toBe("PASS");
    expect(sealed.result.integrityCertified).toBe(true);
    expect(sealed.result.severityCertified).toBe(true);
    expect(sealed.result.propagationCertified).toBe(true);
    expect(sealed.result.replayCertified).toBe(true);
    expect(sealed.result.governanceCertified).toBe(true);
    expect(sealed.result.observabilityCertified).toBe(true);
    expect(sealed.result.evidenceCertified).toBe(true);
    expect(sealed.result.tenantIsolationVerified).toBe(true);
  }, 15000);

  it("reproduces LOW, MODERATE, HIGH, CRITICAL, and BLOCKING severity certifications", () => {
    const base = constraintAnalysisInput();
    const low = sealConstraintCertification(constraintCertificationInput());
    const moderateAnalysis = sealConstraintAnalysis({
      ...base,
      trustFoundation: {
        ...base.trustFoundation,
        result: { ...base.trustFoundation.result, trustState: "CONDITIONALLY_TRUSTED" },
      },
    });
    const highAnalysis = sealConstraintAnalysis({
      ...base,
      dependencyRiskFoundation: {
        ...base.dependencyRiskFoundation,
        result: { ...base.dependencyRiskFoundation.result, dependencyRiskState: "MODERATE" },
      },
    });
    const criticalAnalysis = sealConstraintAnalysis({
      ...base,
      trustFoundation: {
        ...base.trustFoundation,
        result: { ...base.trustFoundation.result, trustState: "DEGRADED" },
      },
    });
    const blockingAnalysis = sealConstraintAnalysis({
      ...base,
      resilienceFoundation: {
        ...base.resilienceFoundation,
        result: { ...base.resilienceFoundation.result, resilienceState: "FRAGILE" },
      },
    });

    expect(low.result.severityCertified).toBe(true);
    expect(sealConstraintCertification(constraintCertificationInput({
      analysis: moderateAnalysis,
      observability: sealConstraintObservability(constraintObservabilityInput({ analysis: moderateAnalysis })),
      replay: sealConstraintReplay(constraintReplayInput({ analysis: moderateAnalysis, observability: sealConstraintObservability(constraintObservabilityInput({ analysis: moderateAnalysis })) })),
    })).result.severityCertified).toBe(true);
    expect(sealConstraintCertification(constraintCertificationInput({
      analysis: highAnalysis,
      observability: sealConstraintObservability(constraintObservabilityInput({ analysis: highAnalysis })),
      replay: sealConstraintReplay(constraintReplayInput({ analysis: highAnalysis, observability: sealConstraintObservability(constraintObservabilityInput({ analysis: highAnalysis })) })),
    })).result.severityCertified).toBe(true);
    expect(sealConstraintCertification(constraintCertificationInput({
      analysis: criticalAnalysis,
      observability: sealConstraintObservability(constraintObservabilityInput({ analysis: criticalAnalysis })),
      replay: sealConstraintReplay(constraintReplayInput({ analysis: criticalAnalysis, observability: sealConstraintObservability(constraintObservabilityInput({ analysis: criticalAnalysis })) })),
    })).result.severityCertified).toBe(true);
    expect(sealConstraintCertification(constraintCertificationInput({
      analysis: blockingAnalysis,
      observability: sealConstraintObservability(constraintObservabilityInput({ analysis: blockingAnalysis })),
      replay: sealConstraintReplay(constraintReplayInput({ analysis: blockingAnalysis, observability: sealConstraintObservability(constraintObservabilityInput({ analysis: blockingAnalysis })) })),
    })).result.severityCertified).toBe(true);
  }, 120000);

  it("drops to CONDITIONAL_PASS when replay is degraded", () => {
    const base = constraintCertificationInput();
    const sealed = sealConstraintCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "LIMITED",
        },
      },
    });

    expect(sealed.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(sealed.validation.reasonCodes).toContain("REPLAY_DEGRADED");
  }, 15000);

  it("drops to CONDITIONAL_PASS when observability or evidence are degraded", () => {
    const base = constraintCertificationInput();
    const observabilityLimited = sealConstraintCertification({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          observabilityState: "LIMITED",
          constraintAuditVisible: false,
        },
      },
    });
    const evidenceDegraded = sealConstraintCertification({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          auditReferences: [],
        },
      },
    });

    expect(observabilityLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityLimited.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
    expect(evidenceDegraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(evidenceDegraded.validation.reasonCodes).toContain("EVIDENCE_DEGRADED");
  }, 15000);

  it("fails on cross-tenant inputs and ownership mismatches", () => {
    const base = constraintCertificationInput();
    const crossTenant = sealConstraintCertification({
      ...base,
      dependencyRiskCertification: {
        ...base.dependencyRiskCertification,
        result: {
          ...base.dependencyRiskCertification.result,
          tenantIsolationVerified: false,
        },
      },
    });
    const mismatchedRecommendations = Object.freeze([
      {
        ...base.recommendations[0],
        ownershipEvidence: {
          ...base.recommendations[0].ownershipEvidence,
          recommendationId: "recommendation-other",
        },
      },
      ...base.recommendations.slice(1),
    ]);
    const foundation = sealRecommendationConstraintFoundation({
      ...certifiableInput(),
      recommendations: mismatchedRecommendations,
    });
    const analysis = sealConstraintAnalysis(constraintAnalysisInput({
      recommendations: mismatchedRecommendations,
      foundation,
    }));
    const observability = sealConstraintObservability(constraintObservabilityInput({
      recommendations: mismatchedRecommendations,
      foundation,
      analysis,
    }));
    const replay = sealConstraintReplay(constraintReplayInput({
      recommendations: mismatchedRecommendations,
      foundation,
      analysis,
      observability,
    }));
    const ownershipMismatch = sealConstraintCertification({
      ...base,
      recommendations: mismatchedRecommendations,
      foundation,
      analysis,
      observability,
      replay,
      readinessCertification: mismatchedRecommendations[0].readinessCertification,
      governanceCertification: mismatchedRecommendations[0].governanceCertification,
      recommendationCertification: mismatchedRecommendations[0].certification,
      recommendationObservabilityCertification: mismatchedRecommendations[0].observabilityCertification,
    });

    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.result.certificationState).toBe("FAIL");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  }, 20000);

  it("fails on governance corruption and replay corruption", () => {
    const base = constraintCertificationInput();
    const governanceBroken = sealConstraintCertification({
      ...base,
      governanceCertification: {
        ...base.governanceCertification,
        result: {
          ...base.governanceCertification.result,
          certificationState: "FAIL",
        },
      },
    });
    const replayBroken = sealConstraintCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "INVALID",
        },
      },
    });

    expect(governanceBroken.result.certificationState).toBe("FAIL");
    expect(governanceBroken.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
    expect(replayBroken.result.certificationState).toBe("FAIL");
    expect(replayBroken.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
  }, 15000);

  it("blocks execution, mutation, routing, approval, prioritization, ranking, scoring, resource allocation, and authority expansion", () => {
    const base = constraintCertificationInput();
    expect(sealConstraintCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealConstraintCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealConstraintCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealConstraintCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealConstraintCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealConstraintCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealConstraintCertification({ ...base, recommendationScoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealConstraintCertification({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealConstraintCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  }, 15000);
});
