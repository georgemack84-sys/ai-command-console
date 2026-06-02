import { describe, expect, it } from "vitest";
import type { RiskCertificationRecord } from "@/services/confidence-engine/riskCertificationGate";
import {
  MAX_BRANCH_COUNT,
  MAX_BRANCH_DEPTH,
  deriveRiskCertificationEvidence,
  generateSimulationBoundaryHash,
  sealSimulationBoundaryContract,
  validateSimulationBoundaryContract,
} from "@/services/simulation-engine";
import type { SimulationBoundaryContractInput } from "@/services/simulation-engine";

function certificationRecord(overrides: Partial<RiskCertificationRecord> = {}): RiskCertificationRecord {
  return {
    result: {
      certification_id: "certification-001",
      tenant_id: "tenant-alpha",
      certification_state: "PASS",
      validated_phases: [],
      validation_results: [],
      failed_requirements: [],
      reason_codes: [],
      authority_validation: true,
      governance_validation: true,
      lineage_validation: true,
      replay_validation: true,
      hash_validation: true,
      tenant_validation: true,
      timestamp: "2026-06-02T14:00:00.000Z",
      version: "risk-certification-gate/v1",
    },
    lineage: {
      lineage_id: "risk-certification-lineage-001",
      tenant_id: "tenant-alpha",
      validated_phases: [],
      phase_hashes: [],
      cross_phase_hashes: [],
      reason_codes: [],
      timestamps: [],
      lineage_hash: "risk-certification-lineage-hash",
    },
    summary: {
      phase_count: 7,
      failure_count: 0,
      conditional_count: 0,
      authority_bounded: true,
      tenant_isolated: true,
      replayable: true,
      fail_closed: true,
      summary_hash: "risk-certification-summary-hash",
    },
    certification_hash: "risk-certification-hash",
    generated_at: "2026-06-02T14:00:00.000Z",
    read_only: true,
    advisory_only: true,
    authority_changed: false,
    mutation_performed: false,
    execution_permitted: false,
    may_execute: false,
    may_schedule: false,
    may_mutate_state: false,
    may_change_approval: false,
    may_change_authority: false,
    may_route_workflow: false,
    may_remediate: false,
    ...overrides,
  } as RiskCertificationRecord;
}

function buildInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  const riskEvidence = deriveRiskCertificationEvidence(certificationRecord());
  return Object.freeze({
    simulationId: "simulation-001",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    simulationType: "BRANCH_REPLAY",
    approvedScope: ["historical-reconstruction", "lineage-replay"],
    branchLimit: 3,
    replayReferenceIds: ["replay-001"],
    evidenceReferences: ["evidence-001"],
    riskCertificationReference: riskEvidence.certificationHash,
    approvalReference: "operator-approval-001",
    operatorId: "operator-alpha",
    governanceVersion: "simulation-governance/v1",
    createdAt: "2026-06-02T14:05:00.000Z",
    contractVersion: "simulation-boundary-contract/v1",
    branches: [
      {
        branchId: "branch-001",
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      },
    ],
    riskCertificationEvidence: riskEvidence,
    ...overrides,
  } satisfies SimulationBoundaryContractInput);
}

describe("simulationBoundaryContract", () => {
  it("seals deterministic immutable contracts for identical inputs", () => {
    const input = buildInput();
    const first = sealSimulationBoundaryContract(input);
    const second = sealSimulationBoundaryContract(input);

    expect(first).toEqual(second);
    expect(first.validation.status).toBe("SEALED");
    expect(first.contract.immutableHash).toBe(generateSimulationBoundaryHash(input));
    expect(first.sealed).toBe(true);
    expect(first.readOnly).toBe(true);
    expect(first.advisoryOnly).toBe(true);
  });

  it("keeps all execution and authority flags false", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      executionAuthorized: true,
      runtimeMutationAllowed: true,
      schedulingAllowed: true,
      authorityMutationAllowed: true,
      persistenceAllowed: true,
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("EXECUTION_AUTHORITY_BLOCKED");
    expect(record.validation.reasonCodes).toContain("RUNTIME_MUTATION_BLOCKED");
    expect(record.validation.reasonCodes).toContain("SCHEDULING_BLOCKED");
    expect(record.validation.reasonCodes).toContain("AUTHORITY_MUTATION_BLOCKED");
    expect(record.validation.reasonCodes).toContain("PERSISTENCE_BLOCKED");
    expect(record.contract.executionAuthorized).toBe(false);
    expect(record.contract.runtimeMutationAllowed).toBe(false);
    expect(record.contract.schedulingAllowed).toBe(false);
    expect(record.contract.authorityMutationAllowed).toBe(false);
    expect(record.contract.persistenceAllowed).toBe(false);
  });

  it("freezes when approval reference is missing", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      approvalReference: "",
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("APPROVAL_REFERENCE_MISSING");
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_INVALID");
  });

  it("escalates when risk certification reference is missing", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      riskCertificationReference: "",
      riskCertificationEvidence: undefined,
    }));

    expect(record.validation.status).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("RISK_CERTIFICATION_MISSING");
    expect(record.observability.escalationState).toBe("ESCALATE");
  });

  it("freezes when risk certification evidence mismatches the reference", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      riskCertificationReference: "wrong-certification-hash",
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("RISK_CERTIFICATION_MISMATCH");
  });

  it("freezes when risk certification evidence is failed", () => {
    const failedEvidence = deriveRiskCertificationEvidence(certificationRecord({
      result: {
        ...certificationRecord().result,
        certification_state: "FAIL",
        replay_validation: false,
      },
    }));
    const record = sealSimulationBoundaryContract(buildInput({
      riskCertificationReference: failedEvidence.certificationHash,
      riskCertificationEvidence: failedEvidence,
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("RISK_CERTIFICATION_NOT_PASSING");
  });

  it("enforces branch ceilings and depth limits", () => {
    const branches = Array.from({ length: MAX_BRANCH_COUNT + 1 }, (_, index) => ({
      branchId: `branch-${index}`,
      depth: index === 0 ? MAX_BRANCH_DEPTH + 1 : 1,
      generatedBySimulation: false,
      nestedSimulation: false,
    }));
    const record = sealSimulationBoundaryContract(buildInput({
      branchLimit: MAX_BRANCH_COUNT + 1,
      branches,
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("BRANCH_COUNT_EXCEEDED");
    expect(record.validation.reasonCodes).toContain("BRANCH_DEPTH_EXCEEDED");
  });

  it("blocks nested, recursive, and self-generated branches", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      branches: [
        {
          branchId: "branch-nested",
          depth: 1,
          generatedBySimulation: false,
          nestedSimulation: true,
        },
        {
          branchId: "branch-recursive",
          parentBranchId: "branch-recursive",
          depth: 1,
          generatedBySimulation: false,
          nestedSimulation: false,
        },
        {
          branchId: "branch-generated",
          depth: 1,
          generatedBySimulation: true,
          nestedSimulation: false,
        },
      ],
    }));

    expect(record.validation.status).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("NESTED_SIMULATION_BLOCKED");
    expect(record.validation.reasonCodes).toContain("RECURSIVE_SIMULATION_BLOCKED");
    expect(record.validation.reasonCodes).toContain("SELF_GENERATED_BRANCH_BLOCKED");
  });

  it("freezes invalid branch limits", () => {
    const validation = validateSimulationBoundaryContract(buildInput({
      branchLimit: 0,
    }));

    expect(validation.status).toBe("FREEZE");
    expect(validation.reasonCodes).toContain("BRANCH_LIMIT_INVALID");
  });

  it("exposes visibility-only observability fields", () => {
    const record = sealSimulationBoundaryContract(buildInput({
      simulationType: "OUTCOME_PROJECTION",
    }));

    expect(record.observability).toEqual({
      simulationId: record.contract.simulationId,
      simulationType: "OUTCOME_PROJECTION",
      contractVersion: record.contract.contractVersion,
      branchCount: record.validation.branchCount,
      governanceVersion: record.contract.governanceVersion,
      immutableHash: record.contract.immutableHash,
      replayStatus: record.validation.replayStatus,
      escalationState: record.validation.escalationState,
    });
  });

  it("replays contract boundary deterministically and read-only", () => {
    const first = sealSimulationBoundaryContract(buildInput());
    const second = sealSimulationBoundaryContract(buildInput());

    expect(first.replay).toEqual(second.replay);
    expect(first.replay.replayMode).toBe("READ_ONLY");
    expect(first.replay.executionAuthorized).toBe(false);
    expect(first.replay.runtimeMutationAllowed).toBe(false);
  });

  it("does not mutate source inputs", () => {
    const input = buildInput();
    const before = JSON.stringify(input);

    sealSimulationBoundaryContract(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
