import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthRecordContractRequest,
  sealTruthClassificationSystem,
  sealTruthRecordContract,
  type TruthCatalogReference,
  type TruthClassificationSystemInput,
  type TruthClassificationType,
  type TruthRecord,
  type TruthRecordContractInput,
} from "@/services/mission-control";

function hash(seed: string): string {
  return seed.padEnd(64, seed).slice(0, 64);
}

function evidenceRef(referenceId: string, tenantId = "tenant-alpha"): TruthCatalogReference {
  return {
    referenceId,
    tenantId,
    immutable: true,
    accessible: true,
    auditable: true,
    resolvable: true,
  };
}

function replayRef(referenceId: string, tenantId = "tenant-alpha"): TruthCatalogReference {
  return {
    referenceId,
    tenantId,
    immutable: true,
    accessible: true,
    auditable: true,
    deterministic: true,
    resolvable: true,
  };
}

function truthRecord(overrides: Partial<TruthRecord> = {}): TruthRecord {
  return {
    truth_record_id: hash("truth-record-alpha"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    timestamp: "2026-06-19T12:00:00.000Z",
    event_type: "RECOMMENDATION_APPROVED",
    event_source: "CERTIFICATION_ENGINE",
    lifecycle_state: "VALIDATED",
    evidence_references: ["evidence-alpha"],
    replay_references: ["replay-alpha"],
    ...overrides,
  };
}

function truthRecordInput(overrides: Partial<TruthRecordContractInput> = {}) {
  return {
    request: buildTruthRecordContractRequest({
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      now: "2026-06-19T12:00:30.000Z",
    }),
    record: truthRecord(),
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    existingTruthRecordIds: [],
    priorLifecycleState: "CREATED" as const,
    immutableBaseline: {
      truth_record_id: hash("truth-record-alpha"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      timestamp: "2026-06-19T12:00:00.000Z",
      event_type: "RECOMMENDATION_APPROVED",
      event_source: "CERTIFICATION_ENGINE",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  } satisfies TruthRecordContractInput;
}

function sealedTruthRecord(overrides: Partial<TruthRecordContractInput> = {}) {
  return sealTruthRecordContract(truthRecordInput(overrides));
}

function classificationInput(overrides: Partial<TruthClassificationSystemInput> = {}): TruthClassificationSystemInput {
  return {
    request: buildTruthClassificationSystemRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:00.000Z",
    }),
    truthRecord: sealedTruthRecord(),
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    lineageCatalog: [evidenceRef("parent-classification-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

const classificationDetails: Record<TruthClassificationType, Record<string, string | number | boolean>> = {
  INPUT: {
    source_identity: "OPERATOR",
    ingestion_timestamp: "2026-06-19T12:00:00.000Z",
    input_lineage: hash("truth-record-alpha"),
    input_integrity_state: "VALID",
  },
  OUTPUT: {
    output_origin: "MISSION_ENGINE",
    output_scope: "mission-alpha",
    intended_audience: "OPERATOR",
    generation_lineage: hash("truth-record-alpha"),
  },
  DECISION: {
    decision_authority: "CERTIFICATION_ENGINE",
    decision_rationale: "Decision rationale",
    decision_outcome: "APPROVED",
  },
  RECOMMENDATION: {
    recommendation_source: "MISSION_ENGINE",
    proposed_action: "Proceed",
    expected_impact: "Positive",
  },
  RISK: {
    risk_category: "operational",
    risk_severity: "HIGH",
    risk_rationale: "Elevated operational exposure",
  },
  CONFIDENCE: {
    confidence_score: 0.95,
    confidence_level: "HIGH",
    confidence_rationale: "Evidence quality is high",
  },
  VIOLATION: {
    violated_rule: "policy-boundary",
    severity: "MAJOR",
    remediation_state: "OPEN",
  },
  GOVERNANCE: {
    governance_authority: "GOVERNANCE_ENGINE",
    governance_action: "APPROVE",
    governance_rationale: "Governance rationale",
    governance_scope: "mission-alpha",
  },
  ESCALATION: {
    escalation_source: "SUPERVISION_ENGINE",
    escalation_target: "MISSION_CONTROL",
    escalation_reason: "Operator review required",
    escalation_outcome: "OPEN",
  },
  RUNTIME: {
    runtime_state: "RESTRICTED",
    runtime_rationale: "Runtime bounded",
  },
};

describe("truthClassificationSystem", () => {
  it("seals deterministic classifications for the same input", () => {
    const first = sealTruthClassificationSystem(classificationInput());
    const second = sealTruthClassificationSystem(classificationInput());

    expect(first).toEqual(second);
    expect(first.validation.validationState).toBe("VALID");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.certification.certificationState).toBe("PASS");
    expect(first.classifications.map((item) => item.classification_type)).toEqual([
      "DECISION",
      "GOVERNANCE",
      "RECOMMENDATION",
    ]);
  });

  it("validates every supported classification taxonomy", () => {
    const supported = Object.keys(classificationDetails) as TruthClassificationType[];

    for (const type of supported) {
      const sealed = sealTruthClassificationSystem(classificationInput({
        requestedClassifications: [type],
        details: classificationDetails[type],
      }));

      expect(sealed.validation.validationState, type).toBe("VALID");
      expect(sealed.classifications).toHaveLength(1);
      expect(sealed.classifications[0]?.classification_type).toBe(type);
    }
  });

  it("fails unsupported classifications fail-closed", () => {
    const sealed = sealTruthClassificationSystem(classificationInput({
      requestedClassifications: ["UNKNOWN" as TruthClassificationType],
    }));

    expect(sealed.validation.validationState).toBe("INVALID");
    expect(sealed.validation.reasonCodes).toContain("CLASSIFICATION_UNSUPPORTED");
    expect(sealed.certification.certificationState).toBe("FAIL");
  });

  it("fails missing evidence and marks replay incomplete", () => {
    const sealed = sealTruthClassificationSystem(classificationInput({
      evidenceCatalog: [],
      requestedClassifications: ["DECISION"],
      details: classificationDetails.DECISION,
    }));

    expect(sealed.validation.validationState).toBe("INVALID");
    expect(sealed.validation.reasonCodes).toContain("CLASSIFICATION_EVIDENCE_INVALID");
    expect(sealed.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
  });

  it("fails invalid lineage and marks replay mismatch", () => {
    const sealed = sealTruthClassificationSystem(classificationInput({
      requestedClassifications: ["GOVERNANCE"],
      details: classificationDetails.GOVERNANCE,
      parentClassificationIds: ["missing-lineage"],
      lineageCatalog: [],
    }));

    expect(sealed.validation.validationState).toBe("INVALID");
    expect(sealed.validation.reasonCodes).toContain("CLASSIFICATION_LINEAGE_INVALID");
    expect(sealed.replay.replayResult).toBe("MISMATCH");
  });

  it("fails unreplayable classifications when replay evidence is not deterministic", () => {
    const sealed = sealTruthClassificationSystem(classificationInput({
      requestedClassifications: ["CONFIDENCE"],
      details: classificationDetails.CONFIDENCE,
      replayCatalog: [{
        ...replayRef("replay-alpha"),
        deterministic: false,
      }],
    }));

    expect(sealed.validation.validationState).toBe("INVALID");
    expect(sealed.validation.reasonCodes).toContain("CLASSIFICATION_REPLAY_INVALID");
    expect(sealed.replay.replayResult).toBe("UNREPLAYABLE");
  });

  it("fails cross-tenant access and preserves tenant scoping", () => {
    const sealed = sealTruthClassificationSystem(classificationInput({
      accessTenantId: "tenant-beta",
      requestedClassifications: ["RUNTIME"],
      details: classificationDetails.RUNTIME,
    }));

    expect(sealed.validation.validationState).toBe("INVALID");
    expect(sealed.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(sealed.operatorVisibility[0]?.tenantScoped).toBe(false);
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = classificationInput({
      requestedClassifications: ["DECISION"],
      details: classificationDetails.DECISION,
    });

    expect(sealTruthClassificationSystem({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthClassificationSystem({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthClassificationSystem({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthClassificationSystem({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthClassificationSystem({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthClassificationSystem({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthClassificationSystem({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
