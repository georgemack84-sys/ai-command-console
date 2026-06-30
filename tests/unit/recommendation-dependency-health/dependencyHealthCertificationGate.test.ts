import { describe, expect, it } from "vitest";
import {
  buildDependencyHealthCertificationRequest,
  createDependencyHealthCertificationEvidencePath,
  sealDependencyHealthCertification,
  type DependencyHealthCertificationInput,
} from "@/services/recommendation-dependency-health";

function hash(seed: string): string {
  return seed.padEnd(64, seed).slice(0, 64);
}

function boundaryRecord<T extends Record<string, unknown>>(extra: T): T & Record<string, unknown> {
  return {
    sealed: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
    ...extra,
  };
}

function certificationRecord(prefix: string, governanceCertified = true): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      governanceCertified,
      certificationHash: hash(`${prefix}-cert`),
    },
  });
}

function foundationRecord(prefix: string, hashField: string): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      [hashField]: hash(`${prefix}-graph`),
    },
  });
}

function replayRecord(prefix: string, replayState: "REPLAYABLE" | "LIMITED" | "ESCALATED" | "INVALID" = "REPLAYABLE"): Record<string, unknown> {
  return boundaryRecord({
    result: {
      tenantIsolationVerified: true,
      replayState,
      replayHash: hash(`${prefix}-replay`),
    },
  });
}

function bundle(id: string, tenantId = "tenant-alpha"): Record<string, unknown> {
  return {
    readiness: boundaryRecord({
      evidencePath: {
        replayReferences: [`${id}:readiness:replay`],
        governanceReferences: [`${id}:readiness:governance`],
      },
      result: { readinessHash: hash(`${id}:readiness`) },
    }),
    alignment: boundaryRecord({
      evidencePath: {
        governanceReferences: [`${id}:alignment:governance`],
      },
      result: { alignmentHash: hash(`${id}:alignment`) },
    }),
    reviewPacket: boundaryRecord({
      evidencePath: {
        lineageReferences: [`${id}:review:lineage`],
      },
      result: { packetHash: hash(`${id}:packet`) },
    }),
    replayFramework: boundaryRecord({
      evidencePath: {
        lineageReferences: [`${id}:framework:lineage`],
        replayReferences: [`${id}:framework:replay`],
      },
      result: {
        replayState: "REPLAYABLE",
        replayHash: hash(`${id}:framework:replay`),
      },
    }),
    readinessCertification: boundaryRecord({
      evidencePath: {
        lineageReferences: [`${id}:readiness-cert:lineage`],
        replayReferences: [`${id}:readiness-cert:replay`],
      },
      result: {
        tenantIsolationVerified: true,
        certificationState: "PASS",
        certificationHash: hash(`${id}:readiness-cert`),
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
      evidencePath: { lineageReferences: [`${id}:lineage:path`] },
      result: {
        reconstructionState: "RECONSTRUCTED",
        lineageIntegrity: true,
        reconstructionHash: hash(`${id}:lineage`),
      },
    }),
    verification: boundaryRecord({
      evidencePath: { lineageReferences: [`${id}:verification:lineage`] },
      result: { verificationHash: hash(`${id}:verification`) },
    }),
    replay: boundaryRecord({
      evidencePath: { evidenceIds: [`${id}:replay:evidence`] },
      result: {
        replayState: "REPLAYABLE",
        replayHash: hash(`${id}:bundle:replay`),
      },
    }),
    integrity: boundaryRecord({
      result: {
        lineageIntegrity: true,
        integrityHash: hash(`${id}:integrity`),
      },
    }),
    certification: boundaryRecord({
      result: { certificationHash: hash(`${id}:recommendation-cert`) },
    }),
    observability: boundaryRecord({
      result: { observabilityHash: hash(`${id}:observability`) },
    }),
    inspection: boundaryRecord({}),
    visibility: boundaryRecord({
      result: { visibilityHash: hash(`${id}:visibility`) },
    }),
    audit: boundaryRecord({
      evidencePath: {
        evidenceIds: [`${id}:audit:evidence`],
        lineageReferences: [`${id}:audit:lineage`],
      },
      result: { exportHash: hash(`${id}:audit`) },
    }),
    observabilityCertification: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        certificationHash: hash(`${id}:observability-cert`),
      },
    }),
    binding: boundaryRecord({
      evidencePath: { governanceReferences: [`${id}:binding:governance`] },
      result: {
        bindingState: "BOUND",
        governanceHash: hash(`${id}:binding`),
      },
    }),
    authorityScope: boundaryRecord({
      evidencePath: { governanceReferences: [`${id}:authority:governance`] },
      result: {
        scopeState: "SCOPED",
        authorityHash: hash(`${id}:authority`),
      },
    }),
    policyVisibility: boundaryRecord({
      evidencePath: { governanceReferences: [`${id}:policy:governance`] },
      result: {
        visibilityState: "VISIBLE",
        policyHash: hash(`${id}:policy`),
      },
    }),
    governanceReplay: boundaryRecord({
      evidencePath: {
        replayReferences: [`${id}:governance-replay:replay`],
        governanceReferences: [`${id}:governance-replay:governance`],
      },
      result: {
        replayState: "REPLAYABLE",
        replayHash: hash(`${id}:governance-replay`),
      },
    }),
    governanceCertification: boundaryRecord({
      evidencePath: { governanceReferences: [`${id}:governance-cert:governance`] },
      result: {
        tenantIsolationVerified: true,
        certificationState: "PASS",
        certificationHash: hash(`${id}:governance-cert`),
      },
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

function certificationInput(overrides: Partial<DependencyHealthCertificationInput> = {}): DependencyHealthCertificationInput {
  const recommendations = Object.freeze([
    bundle("recommendation-alpha"),
    bundle("recommendation-beta"),
  ]) as unknown as readonly Record<string, unknown>[];

  const foundation = boundaryRecord({
    result: {
      tenantId: "tenant-alpha",
      overallHealthState: "HEALTHY",
      healthRecordsCreated: 2,
      stabilityRecordsDetected: 2,
      availabilityRecordsDetected: 2,
      continuityRecordsDetected: 2,
      recoverabilityRecordsDetected: 2,
      degradationRecordsDetected: 2,
      riskRecordsDetected: 2,
      observabilityRecordsDetected: 2,
      tenantIsolationVerified: true,
      healthGraphHash: hash("foundation-health"),
    },
    healthRecords: [
      {
        recommendationId: "recommendation-alpha",
        dependencyId: "dependency-a",
      },
      {
        recommendationId: "recommendation-beta",
        dependencyId: "dependency-b",
      },
    ],
    evidencePath: {
      healthReferences: ["health:a", "health:b"],
      governanceReferences: ["governance:a", "governance:b"],
      lineageReferences: ["lineage:a", "lineage:b"],
      replayReferences: ["replay:a", "replay:b"],
      evidenceHashes: [hash("foundation-evidence-a"), hash("foundation-evidence-b")],
    },
    validation: {
      ownershipValid: true,
    },
  });

  const analysis = boundaryRecord({
    result: {
      tenantId: "tenant-alpha",
      analysisState: "ANALYZED",
      stabilityConditionsDetected: 2,
      availabilityConditionsDetected: 2,
      continuityConditionsDetected: 2,
      recoverabilityConditionsDetected: 2,
      degradationConditionsDetected: 2,
      riskConditionsDetected: 2,
      observabilityConditionsDetected: 2,
      tenantIsolationVerified: true,
      analysisHash: hash("analysis"),
    },
    evidencePath: {
      healthReferences: ["health:a", "health:b"],
      stabilityReferences: ["stability:a", "stability:b"],
      availabilityReferences: ["availability:a", "availability:b"],
      continuityReferences: ["continuity:a", "continuity:b"],
      recoverabilityReferences: ["recoverability:a", "recoverability:b"],
      degradationReferences: ["degradation:a", "degradation:b"],
      riskReferences: ["risk:a", "risk:b"],
      evidenceHashes: [hash("analysis-evidence-a"), hash("analysis-evidence-b")],
    },
  });

  const observability = boundaryRecord({
    result: {
      tenantId: "tenant-alpha",
      observabilityState: "VISIBLE",
      healthGraphVisible: true,
      stabilityVisible: true,
      availabilityVisible: true,
      continuityVisible: true,
      recoverabilityVisible: true,
      degradationVisible: true,
      riskVisible: true,
      observabilityCoverageVisible: true,
      lineageVisible: true,
      governanceVisible: true,
      replayVisible: true,
      auditVisible: true,
      tenantIsolationVerified: true,
      observabilityHash: hash("observability"),
    },
    evidencePath: {
      healthReferences: ["health:a", "health:b"],
      stabilityReferences: ["stability:a", "stability:b"],
      availabilityReferences: ["availability:a", "availability:b"],
      continuityReferences: ["continuity:a", "continuity:b"],
      recoverabilityReferences: ["recoverability:a", "recoverability:b"],
      degradationReferences: ["degradation:a", "degradation:b"],
      riskReferences: ["risk:a", "risk:b"],
      lineageReferences: ["lineage:a", "lineage:b"],
      governanceReferences: ["governance:a", "governance:b"],
      replayReferences: ["replay:a", "replay:b"],
      auditReferences: ["audit:a", "audit:b"],
      evidenceHashes: [hash("observability-evidence-a"), hash("observability-evidence-b")],
    },
  });

  const replay = boundaryRecord({
    result: {
      tenantId: "tenant-alpha",
      replayState: "REPLAYABLE",
      healthReconstructed: true,
      stabilityReconstructed: true,
      availabilityReconstructed: true,
      continuityReconstructed: true,
      recoverabilityReconstructed: true,
      degradationReconstructed: true,
      riskReconstructed: true,
      governanceReconstructed: true,
      tenantIsolationVerified: true,
      replayHash: hash("replay"),
      reconstructionHash: hash("reconstruction"),
    },
    evidencePath: {
      healthReferences: ["health:a", "health:b"],
      stabilityReferences: ["stability:a", "stability:b"],
      availabilityReferences: ["availability:a", "availability:b"],
      continuityReferences: ["continuity:a", "continuity:b"],
      recoverabilityReferences: ["recoverability:a", "recoverability:b"],
      degradationReferences: ["degradation:a", "degradation:b"],
      riskReferences: ["risk:a", "risk:b"],
      lineageReferences: ["lineage:a", "lineage:b"],
      replayReferences: ["replay:a", "replay:b"],
      governanceReferences: ["governance:a", "governance:b"],
      observabilityReferences: ["observability:a", "observability:b"],
      auditReferences: ["audit:a", "audit:b"],
      evidenceHashes: [hash("replay-evidence-a"), hash("replay-evidence-b")],
    },
  });

  return {
    request: buildDependencyHealthCertificationRequest({
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    foundation: foundation as unknown as DependencyHealthCertificationInput["foundation"],
    analysis: analysis as unknown as DependencyHealthCertificationInput["analysis"],
    observability: observability as unknown as DependencyHealthCertificationInput["observability"],
    replay: replay as unknown as DependencyHealthCertificationInput["replay"],
    constraintFoundation: foundationRecord("constraint", "constraintGraphHash") as unknown as DependencyHealthCertificationInput["constraintFoundation"],
    constraintCertification: certificationRecord("constraint") as unknown as DependencyHealthCertificationInput["constraintCertification"],
    opportunityFoundation: foundationRecord("opportunity", "opportunityGraphHash") as unknown as DependencyHealthCertificationInput["opportunityFoundation"],
    opportunityCertification: certificationRecord("opportunity") as unknown as DependencyHealthCertificationInput["opportunityCertification"],
    dependencyRiskFoundation: foundationRecord("dependency-risk", "dependencyRiskGraphHash") as unknown as DependencyHealthCertificationInput["dependencyRiskFoundation"],
    dependencyRiskCertification: certificationRecord("dependency-risk") as unknown as DependencyHealthCertificationInput["dependencyRiskCertification"],
    dependencyFoundation: foundationRecord("dependency", "dependencyGraphHash") as unknown as DependencyHealthCertificationInput["dependencyFoundation"],
    dependencyReplay: replayRecord("dependency") as unknown as DependencyHealthCertificationInput["dependencyReplay"],
    dependencyCertification: certificationRecord("dependency") as unknown as DependencyHealthCertificationInput["dependencyCertification"],
    impactFoundation: foundationRecord("impact", "impactGraphHash") as unknown as DependencyHealthCertificationInput["impactFoundation"],
    impactCertification: certificationRecord("impact") as unknown as DependencyHealthCertificationInput["impactCertification"],
    trustFoundation: foundationRecord("trust", "trustGraphHash") as unknown as DependencyHealthCertificationInput["trustFoundation"],
    trustReplay: replayRecord("trust") as unknown as DependencyHealthCertificationInput["trustReplay"],
    trustCertification: certificationRecord("trust") as unknown as DependencyHealthCertificationInput["trustCertification"],
    driftFoundation: foundationRecord("drift", "driftGraphHash") as unknown as DependencyHealthCertificationInput["driftFoundation"],
    driftReplay: replayRecord("drift") as unknown as DependencyHealthCertificationInput["driftReplay"],
    driftCertification: certificationRecord("drift") as unknown as DependencyHealthCertificationInput["driftCertification"],
    resilienceFoundation: foundationRecord("resilience", "resilienceGraphHash") as unknown as DependencyHealthCertificationInput["resilienceFoundation"],
    resilienceReplay: replayRecord("resilience") as unknown as DependencyHealthCertificationInput["resilienceReplay"],
    resilienceCertification: certificationRecord("resilience") as unknown as DependencyHealthCertificationInput["resilienceCertification"],
    portfolio: boundaryRecord({
      result: {
        tenantIsolationVerified: true,
        portfolioHash: hash("portfolio"),
      },
    }) as unknown as DependencyHealthCertificationInput["portfolio"],
    portfolioCertification: certificationRecord("portfolio") as unknown as DependencyHealthCertificationInput["portfolioCertification"],
    recommendations: recommendations as unknown as DependencyHealthCertificationInput["recommendations"],
    ...overrides,
  };
}

describe("dependencyHealthCertificationGate", () => {
  it("is deterministic and produces stable certification hashes", () => {
    const input = certificationInput();
    const first = sealDependencyHealthCertification(input);
    const second = sealDependencyHealthCertification(input);

    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps certification ordering deterministic when recommendations are reversed", () => {
    const input = certificationInput();
    const reversed = certificationInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });

    expect(sealDependencyHealthCertification(reversed)).toEqual(sealDependencyHealthCertification(input));
    expect(createDependencyHealthCertificationEvidencePath(reversed)).toEqual(createDependencyHealthCertificationEvidencePath(input));
  });

  it("certifies the health dimensions, governance, observability, evidence, and lineage", () => {
    const sealed = sealDependencyHealthCertification(certificationInput());

    expect(sealed.result.integrityCertified).toBe(true);
    expect(sealed.result.stabilityCertified).toBe(true);
    expect(sealed.result.availabilityCertified).toBe(true);
    expect(sealed.result.continuityCertified).toBe(true);
    expect(sealed.result.recoverabilityCertified).toBe(true);
    expect(sealed.result.degradationCertified).toBe(true);
    expect(sealed.result.riskCertified).toBe(true);
    expect(sealed.result.governanceCertified).toBe(true);
    expect(sealed.result.observabilityCertified).toBe(true);
    expect(sealed.result.evidenceCertified).toBe(true);
    expect(sealed.validation.lineageCertified).toBe(true);
  });

  it("surfaces replay degradation, observability incompleteness, and evidence degradation as CONDITIONAL_PASS", () => {
    const base = certificationInput();
    const replayDegraded = sealDependencyHealthCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "LIMITED",
        },
      },
    });
    const observabilityIncomplete = sealDependencyHealthCertification({
      ...base,
      observability: {
        ...base.observability,
        result: {
          ...base.observability.result,
          observabilityState: "LIMITED",
          replayVisible: false,
        },
      },
    });
    const evidenceDegraded = sealDependencyHealthCertification({
      ...base,
      observability: {
        ...base.observability,
        evidencePath: {
          ...base.observability.evidencePath,
          auditReferences: [],
        },
      },
    });

    expect(replayDegraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayDegraded.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityIncomplete.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityIncomplete.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
    expect(evidenceDegraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(evidenceDegraded.validation.reasonCodes).toContain("EVIDENCE_DEGRADED");
  });

  it("fails on cross-tenant artifacts, ownership mismatch, replay corruption, and governance corruption", () => {
    const base = certificationInput();
    const crossTenant = sealDependencyHealthCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" },
        },
        ...base.recommendations.slice(1),
      ]),
    });
    const ownershipMismatch = sealDependencyHealthCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" },
        },
        ...base.recommendations.slice(1),
      ]),
    });
    const replayCorrupted = sealDependencyHealthCertification({
      ...base,
      replay: {
        ...base.replay,
        result: {
          ...base.replay.result,
          replayState: "ESCALATED",
        },
      },
    });
    const governanceCorrupted = sealDependencyHealthCertification({
      ...base,
      recommendations: Object.freeze([
        {
          ...base.recommendations[0],
          governanceCertification: {
            ...base.recommendations[0].governanceCertification,
            result: {
              ...base.recommendations[0].governanceCertification.result,
              certificationState: "FAIL",
            },
          },
        },
        ...base.recommendations.slice(1),
      ]),
    });

    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
    expect(replayCorrupted.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(governanceCorrupted.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
  });

  it("blocks execution, mutation, routing, prioritization, ranking, approval, scoring, resource allocation, and authority expansion", () => {
    const base = certificationInput();
    expect(sealDependencyHealthCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDependencyHealthCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, recommendationScoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealDependencyHealthCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("fails when certification evidence exceeds the declared limits", () => {
    const base = certificationInput();
    const overflow = Object.freeze(Array.from(
      { length: 10_001 },
      (_, index) => `evidence:overflow:${index.toString().padStart(5, "0")}`,
    ));
    const failed = sealDependencyHealthCertification({
      ...base,
      replay: {
        ...base.replay,
        evidencePath: {
          ...base.replay.evidencePath,
          auditReferences: overflow,
        },
      },
    });

    expect(failed.result.certificationState).toBe("FAIL");
    expect(failed.validation.reasonCodes).toContain("EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  });
});
