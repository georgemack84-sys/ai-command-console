import { describe, expect, it } from "vitest";
import {
  createDriftAnalysisEvidencePath,
  sealDriftAnalysis,
  sealRecommendationDriftFoundation,
} from "@/services/recommendation-drift";
import {
  driftAnalysisInput,
  driftFoundationInput,
} from "./recommendationDriftFixtures";

describe("driftAnalysisEngine", () => {
  it("is deterministic and reproduces analysis hashes", () => {
    const input = driftAnalysisInput();
    const first = sealDriftAnalysis(input);
    const second = sealDriftAnalysis(input);
    expect(first).toEqual(second);
    expect(first.result.analysisHash).toHaveLength(64);
  }, 15000);

  it("keeps analysis ordering deterministic", () => {
    const input = driftAnalysisInput();
    const reversed = driftAnalysisInput({
      recommendations: Object.freeze([...input.recommendations].reverse()),
    });
    expect(sealDriftAnalysis(reversed)).toEqual(sealDriftAnalysis(input));
    expect(createDriftAnalysisEvidencePath(
      input,
      ["severity:a"],
      ["propagation:a"],
      ["concentration:a"],
      ["gap:a"],
      ["conflict:a"],
    )).toEqual(createDriftAnalysisEvidencePath(
      input,
      ["severity:a"],
      ["propagation:a"],
      ["concentration:a"],
      ["gap:a"],
      ["conflict:a"],
    ));
  });

  it("classifies LOW, MODERATE, HIGH, and CRITICAL severities reproducibly", () => {
    const base = driftAnalysisInput();
    const low = sealDriftAnalysis({
      ...base,
      foundation: sealRecommendationDriftFoundation({
        ...driftFoundationInput(),
        request: { ...driftFoundationInput().request, driftScope: "EVIDENCE" },
        currentRecommendations: Object.freeze([
          {
            ...driftFoundationInput().currentRecommendations[0],
            ledger: {
              ...driftFoundationInput().currentRecommendations[0].ledger,
              entry: { ...driftFoundationInput().currentRecommendations[0].ledger.entry, evidenceIds: Object.freeze(["evidence:low"]) },
            },
          },
          driftFoundationInput().currentRecommendations[1],
        ]),
      }),
    });
    const moderate = sealDriftAnalysis({
      ...base,
      foundation: sealRecommendationDriftFoundation({
        ...driftFoundationInput(),
        request: { ...driftFoundationInput().request, driftScope: "REPLAY" },
        currentRecommendations: Object.freeze([
          {
            ...driftFoundationInput().currentRecommendations[0],
            replayEvidence: { ...driftFoundationInput().currentRecommendations[0].replayEvidence, replayReferences: Object.freeze(["replay:moderate"]) },
          },
          driftFoundationInput().currentRecommendations[1],
        ]),
      }),
    });
    const high = sealDriftAnalysis(base);
    const critical = sealDriftAnalysis({
      ...base,
      foundation: sealRecommendationDriftFoundation({
        ...driftFoundationInput(),
        request: { ...driftFoundationInput().request, driftScope: "GOVERNANCE" },
        currentRecommendations: Object.freeze([
          {
            ...driftFoundationInput().currentRecommendations[0],
            governanceCertification: {
              ...driftFoundationInput().currentRecommendations[0].governanceCertification,
              result: { ...driftFoundationInput().currentRecommendations[0].governanceCertification.result, certificationHash: "c".repeat(64) },
            },
            governanceReferences: { ...driftFoundationInput().currentRecommendations[0].governanceReferences, governanceReferences: Object.freeze(["gov:critical"]) },
          },
          driftFoundationInput().currentRecommendations[1],
        ]),
      }),
      impactCertification: { ...base.impactCertification, result: { ...base.impactCertification.result, governanceCertified: false } },
    });
    expect(low.evidencePath.severityReferences.some((ref) => ref.endsWith(":LOW"))).toBe(true);
    expect(moderate.evidencePath.severityReferences.some((ref) => ref.endsWith(":MODERATE"))).toBe(true);
    expect(high.evidencePath.severityReferences.some((ref) => ref.endsWith(":HIGH"))).toBe(true);
    expect(critical.evidencePath.severityReferences.some((ref) => ref.endsWith(":CRITICAL"))).toBe(true);
  });

  it("analyzes propagation and concentration reproducibly", () => {
    const sealed = sealDriftAnalysis(driftAnalysisInput());
    expect(sealed.result.propagationPathsDetected).toBeGreaterThan(0);
    expect(sealed.result.driftConcentrationsDetected).toBeGreaterThan(0);
  });

  it("surfaces gaps and conflicts deterministically as LIMITED", () => {
    const base = driftAnalysisInput();
    const gaps = sealDriftAnalysis({
      ...base,
      foundation: {
        ...base.foundation,
        evidencePath: {
          ...base.foundation.evidencePath,
          baselineReferences: Object.freeze([]),
        },
      },
    });
    const conflicts = sealDriftAnalysis(base);
    expect(gaps.result.analysisState).toBe("LIMITED");
    expect(gaps.validation.reasonCodes).toContain("DRIFT_GAPS_DETECTED");
    expect(conflicts.result.analysisState).toBe("LIMITED");
    expect(conflicts.validation.reasonCodes).toContain("DRIFT_CONFLICTS_DETECTED");
  });

  it("blocks cross-tenant drift and ownership mismatch", () => {
    const base = driftAnalysisInput();
    const crossTenant = sealDriftAnalysis({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" } },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealDriftAnalysis({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" } },
        base.recommendations[1],
      ]),
    });
    expect(crossTenant.result.analysisState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_DRIFT_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, mutation, prioritization, approval, repair, workflow routing, and authority expansion", () => {
    const base = driftAnalysisInput();
    expect(sealDriftAnalysis({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDriftAnalysis({ ...base, analysisMutationAttempted: true }).validation.reasonCodes).toContain("ANALYSIS_MUTATION_DETECTED");
    expect(sealDriftAnalysis({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDriftAnalysis({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealDriftAnalysis({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealDriftAnalysis({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDriftAnalysis({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
