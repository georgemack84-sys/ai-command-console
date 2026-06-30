import { describe, expect, it } from "vitest";
import {
  buildCrossDomainValidationRequest,
  buildRecommendationIntelligenceCompletionRequest,
  buildRecommendationIntelligenceObservabilityRequest,
  sealCrossDomainValidationEngine,
  sealRecommendationIntelligenceCompletionContract,
  sealRecommendationIntelligenceObservabilityLayer,
  type CrossDomainValidationInput,
  type RecommendationIntelligenceCompletionInput,
  type RecommendationIntelligenceObservabilityInput,
} from "@/services/recommendation-intelligence";

function hash(seed: string): string {
  return seed.padEnd(64, seed).slice(0, 64);
}

function boundaryRecord<T extends Record<string, unknown>>(extra: T): T & Record<string, unknown> {
  return {
    sealed: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    approvalAllowed: false,
    recommendationApprovalAllowed: false,
    recommendationRankingAllowed: false,
    recommendationPrioritizationAllowed: false,
    prioritizationAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    approvalBehaviorAllowed: false,
    governanceExecutionAllowed: false,
    policyExecutionAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
    ...extra,
  };
}

function foundation(prefix: string, hashKey: string, stateKey: string, state = "ESTABLISHED"): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      [hashKey]: hash(`${prefix}:${hashKey}`),
      [stateKey]: state,
    },
    evidencePath: {
      governanceReferences: [`${prefix}:governance`],
      lineageReferences: [`${prefix}:lineage`],
      replayReferences: [`${prefix}:replay`],
      evidenceHashes: [hash(`${prefix}:evidence`)],
    },
    validation: {
      ownershipValid: true,
      observabilityPreserved: true,
    },
  });
}

function replay(prefix: string, replayState = "REPLAYABLE"): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      replayState,
      replayHash: hash(`${prefix}:replay-hash`),
      reconstructionHash: hash(`${prefix}:reconstruction-hash`),
    },
    evidencePath: {
      governanceReferences: [`${prefix}:governance`],
      lineageReferences: [`${prefix}:lineage`],
      replayReferences: [`${prefix}:replay`],
      observabilityReferences: [`${prefix}:observability`],
      auditReferences: [`${prefix}:audit`],
      evidenceHashes: [hash(`${prefix}:replay-evidence`)],
    },
  });
}

function certification(prefix: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      certificationState: "PASS",
      certificationHash: hash(`${prefix}:certification-hash`),
      governanceCertified: true,
      observabilityCertified: true,
      ...extra,
    },
    evidencePath: {
      governanceReferences: [`${prefix}:governance`],
      lineageReferences: [`${prefix}:lineage`],
      replayReferences: [`${prefix}:replay`],
      evidenceHashes: [hash(`${prefix}:cert-evidence`)],
    },
    validation: {
      observabilityPreserved: true,
    },
  });
}

function bundle(id: string, tenantId = "tenant-alpha"): Record<string, unknown> {
  return {
    readiness: boundaryRecord({
      result: { readinessState: "READY", readinessHash: hash(`${id}:readiness`) },
      evidencePath: {
        governanceReferences: [`${id}:readiness:governance`],
        replayReferences: [`${id}:readiness:replay`],
      },
    }),
    alignment: boundaryRecord({
      result: { alignmentState: "ALIGNED", alignmentHash: hash(`${id}:alignment`) },
      evidencePath: { governanceReferences: [`${id}:alignment:governance`] },
    }),
    reviewPacket: boundaryRecord({
      result: { packetState: "READY_FOR_REVIEW", packetHash: hash(`${id}:packet`) },
      evidencePath: { lineageReferences: [`${id}:review:lineage`] },
    }),
    replayFramework: boundaryRecord({
      result: { replayState: "REPLAYABLE", replayHash: hash(`${id}:framework`) },
      evidencePath: {
        lineageReferences: [`${id}:framework:lineage`],
        replayReferences: [`${id}:framework:replay`],
      },
    }),
    readinessCertification: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        certificationState: "PASS",
        governanceCertified: true,
        certificationHash: hash(`${id}:readiness-cert`),
      },
      evidencePath: {
        lineageReferences: [`${id}:readiness-cert:lineage`],
        replayReferences: [`${id}:readiness-cert:replay`],
      },
    }),
    ledger: boundaryRecord({
      entry: {
        recommendationId: id,
        tenantId,
        lineageReferences: [`${id}:ledger:lineage`],
      },
      result: { ledgerHash: hash(`${id}:ledger`) },
    }),
    lineage: boundaryRecord({
      ancestryChain: [{ lineageReference: `${id}:ancestor:lineage` }],
      result: {
        reconstructionState: "RECONSTRUCTED",
        reconstructionHash: hash(`${id}:lineage`),
      },
      evidencePath: { lineageReferences: [`${id}:lineage:path`] },
    }),
    verification: boundaryRecord({
      result: { verificationHash: hash(`${id}:verification`) },
      evidencePath: { lineageReferences: [`${id}:verification:lineage`] },
    }),
    replay: boundaryRecord({
      result: { replayState: "REPLAYABLE", replayHash: hash(`${id}:replay`) },
      evidencePath: { evidenceIds: [`${id}:replay:evidence`] },
    }),
    integrity: boundaryRecord({
      result: { integrityHash: hash(`${id}:integrity`) },
    }),
    certification: boundaryRecord({
      result: { certificationHash: hash(`${id}:memory-cert`) },
    }),
    observability: boundaryRecord({
      result: { observabilityState: "VISIBLE", observabilityHash: hash(`${id}:observability`), replayVisible: true },
    }),
    inspection: boundaryRecord({ result: { inspectionState: "AVAILABLE" } }),
    visibility: boundaryRecord({ result: { visibilityState: "VISIBLE", visibilityHash: hash(`${id}:visibility`) } }),
    audit: boundaryRecord({
      result: { exportState: "EXPORTED", exportHash: hash(`${id}:audit`) },
      evidencePath: {
        evidenceIds: [`${id}:audit:evidence`],
        lineageReferences: [`${id}:audit:lineage`],
      },
    }),
    observabilityCertification: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        certificationHash: hash(`${id}:observability-cert`),
      },
    }),
    binding: boundaryRecord({
      result: { bindingState: "BOUND", governanceHash: hash(`${id}:binding`) },
      evidencePath: { governanceReferences: [`${id}:binding:governance`] },
    }),
    authorityScope: boundaryRecord({
      result: { scopeState: "SCOPED", authorityHash: hash(`${id}:authority`) },
      evidencePath: { governanceReferences: [`${id}:authority:governance`] },
    }),
    policyVisibility: boundaryRecord({
      result: { visibilityState: "VISIBLE", policyHash: hash(`${id}:policy`) },
      evidencePath: { governanceReferences: [`${id}:policy:governance`] },
    }),
    governanceReplay: boundaryRecord({
      result: { replayState: "REPLAYABLE", replayHash: hash(`${id}:governance-replay`) },
      evidencePath: {
        governanceReferences: [`${id}:governance-replay:governance`],
        replayReferences: [`${id}:governance-replay:replay`],
      },
    }),
    governanceCertification: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        certificationState: "PASS",
        certificationHash: hash(`${id}:governance-cert`),
      },
      evidencePath: { governanceReferences: [`${id}:governance-cert:governance`] },
    }),
    governanceReferences: {
      sealed: true,
      tenantId,
      governanceReferences: [`${id}:governance:ref`],
    },
    ownershipEvidence: {
      sealed: true,
      tenantId,
      recommendationId: id,
      ownershipReferences: [`${id}:ownership:ref`],
    },
    replayEvidence: {
      sealed: true,
      tenantId,
      replayReferences: [`${id}:replay-evidence:ref`],
    },
  };
}

function completionInput(
  overrides: Partial<RecommendationIntelligenceCompletionInput> = {},
): RecommendationIntelligenceCompletionInput {
  return {
    request: buildRecommendationIntelligenceCompletionRequest({
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    }),
    recommendations: Object.freeze([bundle("recommendation-alpha")]) as unknown as RecommendationIntelligenceCompletionInput["recommendations"],
    portfolio: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        portfolioHash: hash("portfolio"),
        portfolioState: "ESTABLISHED",
      },
      evidencePath: {
        governanceReferences: ["portfolio:governance"],
        lineageReferences: ["portfolio:lineage"],
        replayReferences: ["portfolio:replay"],
        evidenceHashes: [hash("portfolio:evidence")],
      },
      validation: {
        ownershipValid: true,
        observabilityPreserved: true,
      },
    }) as unknown as RecommendationIntelligenceCompletionInput["portfolio"],
    portfolioReplay: replay("portfolio") as unknown as RecommendationIntelligenceCompletionInput["portfolioReplay"],
    portfolioCertification: certification("portfolio") as unknown as RecommendationIntelligenceCompletionInput["portfolioCertification"],
    dependencyFoundation: foundation("dependency", "dependencyGraphHash", "dependencyState") as unknown as RecommendationIntelligenceCompletionInput["dependencyFoundation"],
    dependencyReplay: replay("dependency") as unknown as RecommendationIntelligenceCompletionInput["dependencyReplay"],
    dependencyCertification: certification("dependency") as unknown as RecommendationIntelligenceCompletionInput["dependencyCertification"],
    impactFoundation: foundation("impact", "impactGraphHash", "impactState") as unknown as RecommendationIntelligenceCompletionInput["impactFoundation"],
    impactReplay: replay("impact") as unknown as RecommendationIntelligenceCompletionInput["impactReplay"],
    impactCertification: certification("impact") as unknown as RecommendationIntelligenceCompletionInput["impactCertification"],
    driftFoundation: foundation("drift", "driftGraphHash", "driftState") as unknown as RecommendationIntelligenceCompletionInput["driftFoundation"],
    driftReplay: replay("drift") as unknown as RecommendationIntelligenceCompletionInput["driftReplay"],
    driftCertification: certification("drift") as unknown as RecommendationIntelligenceCompletionInput["driftCertification"],
    trustFoundation: foundation("trust", "trustGraphHash", "trustState", "TRUSTED") as unknown as RecommendationIntelligenceCompletionInput["trustFoundation"],
    trustReplay: replay("trust") as unknown as RecommendationIntelligenceCompletionInput["trustReplay"],
    trustCertification: certification("trust") as unknown as RecommendationIntelligenceCompletionInput["trustCertification"],
    resilienceFoundation: foundation("resilience", "resilienceGraphHash", "resilienceState") as unknown as RecommendationIntelligenceCompletionInput["resilienceFoundation"],
    resilienceReplay: replay("resilience") as unknown as RecommendationIntelligenceCompletionInput["resilienceReplay"],
    resilienceCertification: certification("resilience") as unknown as RecommendationIntelligenceCompletionInput["resilienceCertification"],
    dependencyRiskFoundation: foundation("dependency-risk", "dependencyRiskGraphHash", "dependencyRiskState") as unknown as RecommendationIntelligenceCompletionInput["dependencyRiskFoundation"],
    dependencyRiskReplay: replay("dependency-risk") as unknown as RecommendationIntelligenceCompletionInput["dependencyRiskReplay"],
    dependencyRiskCertification: certification("dependency-risk") as unknown as RecommendationIntelligenceCompletionInput["dependencyRiskCertification"],
    opportunityFoundation: foundation("opportunity", "opportunityGraphHash", "opportunityState", "STRONG") as unknown as RecommendationIntelligenceCompletionInput["opportunityFoundation"],
    opportunityReplay: replay("opportunity") as unknown as RecommendationIntelligenceCompletionInput["opportunityReplay"],
    opportunityCertification: certification("opportunity") as unknown as RecommendationIntelligenceCompletionInput["opportunityCertification"],
    constraintFoundation: foundation("constraint", "constraintGraphHash", "constraintState", "DEFINED") as unknown as RecommendationIntelligenceCompletionInput["constraintFoundation"],
    constraintReplay: replay("constraint") as unknown as RecommendationIntelligenceCompletionInput["constraintReplay"],
    constraintCertification: certification("constraint") as unknown as RecommendationIntelligenceCompletionInput["constraintCertification"],
    dependencyHealthFoundation: foundation("dependency-health", "healthGraphHash", "overallHealthState") as unknown as RecommendationIntelligenceCompletionInput["dependencyHealthFoundation"],
    dependencyHealthReplay: replay("dependency-health") as unknown as RecommendationIntelligenceCompletionInput["dependencyHealthReplay"],
    dependencyHealthCertification: certification("dependency-health") as unknown as RecommendationIntelligenceCompletionInput["dependencyHealthCertification"],
    ...overrides,
  };
}

function validationInput(
  completionOverrides: Partial<RecommendationIntelligenceCompletionInput> = {},
  validationOverrides: Partial<CrossDomainValidationInput> = {},
): CrossDomainValidationInput {
  const baseCompletionInput = completionInput(completionOverrides);
  return {
    ...baseCompletionInput,
    request: buildCrossDomainValidationRequest({
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    }),
    completion: sealRecommendationIntelligenceCompletionContract(baseCompletionInput),
    ...validationOverrides,
  };
}

function observabilityInput(
  completionOverrides: Partial<RecommendationIntelligenceCompletionInput> = {},
  crossOverrides: Partial<CrossDomainValidationInput> = {},
  observabilityOverrides: Partial<RecommendationIntelligenceObservabilityInput> = {},
): RecommendationIntelligenceObservabilityInput {
  const baseValidationInput = validationInput(completionOverrides, crossOverrides);
  return {
    ...baseValidationInput,
    request: buildRecommendationIntelligenceObservabilityRequest({
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    }),
    completion: sealRecommendationIntelligenceCompletionContract(completionInput(completionOverrides)),
    validationRecord: sealCrossDomainValidationEngine(baseValidationInput),
    ...observabilityOverrides,
  };
}

describe("recommendationIntelligenceObservabilityLayer", () => {
  it("is deterministic and produces stable observability hashes", () => {
    const first = sealRecommendationIntelligenceObservabilityLayer(observabilityInput());
    const second = sealRecommendationIntelligenceObservabilityLayer(observabilityInput());

    expect(first).toEqual(second);
    expect(first.result.overallObservabilityState).toBe("VISIBLE");
    expect(first.result.observabilityHash).toHaveLength(64);
  });

  it("builds deterministic visibility records for all required scopes", () => {
    const sealed = sealRecommendationIntelligenceObservabilityLayer(observabilityInput());

    expect(sealed.result.scopesEvaluated).toBe(9);
    expect(sealed.observabilityRecords.map((record) => record.scope)).toEqual([
      "SUMMARY",
      "COMPLETION",
      "VALIDATION",
      "GOVERNANCE",
      "LINEAGE",
      "REPLAY",
      "AUDIT",
      "CERTIFICATION",
      "FULL",
    ]);
  });

  it("reproduces VISIBLE, LIMITED, OBSERVE, and INVALID states", () => {
    const visible = sealRecommendationIntelligenceObservabilityLayer(observabilityInput());
    const limited = sealRecommendationIntelligenceObservabilityLayer(observabilityInput({
      dependencyReplay: replay("dependency", "LIMITED") as unknown as RecommendationIntelligenceCompletionInput["dependencyReplay"],
    }));
    const observe = sealRecommendationIntelligenceObservabilityLayer(observabilityInput({
      recommendations: Object.freeze([
        {
          ...bundle("recommendation-alpha"),
          audit: boundaryRecord({
            result: { exportState: "EXPORTED", exportHash: hash("audit:missing") },
            evidencePath: {
              evidenceIds: [],
              lineageReferences: [],
            },
          }),
        },
      ]) as unknown as RecommendationIntelligenceCompletionInput["recommendations"],
    }));
    const invalid = sealRecommendationIntelligenceObservabilityLayer(observabilityInput(
      {},
      {
        authorityExpansionDetected: true,
      },
    ));

    expect(visible.result.overallObservabilityState).toBe("VISIBLE");
    expect(limited.result.overallObservabilityState).toBe("LIMITED");
    expect(observe.observabilityRecords.find((record) => record.scope === "AUDIT")?.observabilityState).toBe("OBSERVE");
    expect(invalid.result.overallObservabilityState).toBe("INVALID");
  });

  it("blocks cross-tenant visibility and ownership mismatches", () => {
    const crossTenant = sealRecommendationIntelligenceObservabilityLayer(observabilityInput({
      recommendations: Object.freeze([bundle("recommendation-alpha", "tenant-beta")]) as unknown as RecommendationIntelligenceCompletionInput["recommendations"],
    }));
    const ownershipMismatch = sealRecommendationIntelligenceObservabilityLayer(observabilityInput({
      recommendations: Object.freeze([
        {
          ...bundle("recommendation-alpha"),
          ownershipEvidence: {
            sealed: true,
            tenantId: "tenant-alpha",
            recommendationId: "recommendation-other",
            ownershipReferences: ["bad:ownership"],
          },
        },
      ]) as unknown as RecommendationIntelligenceCompletionInput["recommendations"],
    }));

    expect(crossTenant.result.overallObservabilityState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_VISIBILITY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("preserves deterministic evidence ordering regardless of recommendation ordering", () => {
    const base = completionInput();
    const reversed = observabilityInput({
      recommendations: Object.freeze([...base.recommendations].reverse()),
    });

    expect(sealRecommendationIntelligenceObservabilityLayer(reversed).evidencePath).toEqual(
      sealRecommendationIntelligenceObservabilityLayer(observabilityInput()).evidencePath,
    );
  });

  it("enforces non-control boundaries", () => {
    const base = observabilityInput();

    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, recommendationScoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealRecommendationIntelligenceObservabilityLayer({ ...base, observabilityMutationAttempted: true }).validation.reasonCodes).toContain("OBSERVABILITY_MUTATION_DETECTED");
  });
});
