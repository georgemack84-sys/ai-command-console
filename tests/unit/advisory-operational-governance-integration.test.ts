import { describe, expect, it } from "vitest";

import {
  integrateOperationalGovernanceVisibility,
  type OperationalGovernanceIntegrationInput,
} from "@/services/advisory/advisoryOperationalGovernanceIntegration";

function completeInput(overrides: Partial<OperationalGovernanceIntegrationInput> = {}): OperationalGovernanceIntegrationInput {
  return {
    governanceStates: [
      { source: "Meta-Certification", status: "META_CERTIFIED", hash: "sha256:meta", present: true, required: true },
      { source: "Program Completion", status: "PROGRAM_COMPLETE", hash: "sha256:program", present: true, required: true },
    ],
    certificationStates: [
      { source: "Sustainability Certification", status: "SUSTAINABILITY_CERTIFIED", hash: "sha256:sustainability", present: true, required: true },
    ],
    sustainabilityStates: [
      { source: "Sustainability Review UI", status: "SEALED", hash: "1558b74", present: true, required: true },
      { source: "Sustainability Final Seal", status: "SEALED", hash: "45bcd16", present: true, required: true },
    ],
    maintenanceStates: [
      { source: "Maintenance Framework", status: "MAINTENANCE_READY", hash: "sha256:maintenance", present: true, required: true },
    ],
    replayReadiness: {
      replayable: true,
      sealLineageVisible: true,
      verificationLineageVisible: true,
      certificationLineageVisible: true,
      artifactContinuityVisible: true,
    },
    reasons: ["CONTROLLED_AUTONOMY_VISIBILITY_READY"],
    ...overrides,
  };
}

describe("operational governance integration", () => {
  it("aggregates complete governance visibility as INTEGRATED", () => {
    const result = integrateOperationalGovernanceVisibility(completeInput());

    expect(result.integrationStatus).toBe("INTEGRATED");
    expect(result.integrationHash).toMatch(/^sha256:/);
    expect(result.governanceStates.map((state) => state.source)).toEqual(["Meta-Certification", "Program Completion"]);
    expect(result.certificationStates[0]?.status).toBe("SUSTAINABILITY_CERTIFIED");
    expect(result.sustainabilityStates.map((state) => state.source)).toEqual(["Sustainability Final Seal", "Sustainability Review UI"]);
    expect(result.maintenanceStates[0]?.status).toBe("MAINTENANCE_READY");
    expect(result.replayReadiness.replayable).toBe(true);
    expect(result.authority).toBe("READ_ONLY");
  });

  it("keeps aggregation and ordering deterministic", () => {
    const first = integrateOperationalGovernanceVisibility(completeInput({
      governanceStates: [
        { source: "Program Completion", status: "PROGRAM_COMPLETE", hash: "sha256:program", present: true, required: true },
        { source: "Meta-Certification", status: "META_CERTIFIED", hash: "sha256:meta", present: true, required: true },
      ],
    }));
    const second = integrateOperationalGovernanceVisibility(completeInput());

    expect(first.integrationHash).toBe(second.integrationHash);
    expect(first.governanceStates.map((state) => state.source)).toEqual(["Meta-Certification", "Program Completion"]);
  });

  it("returns PARTIALLY_INTEGRATED for optional missing state or replay visibility gaps", () => {
    const result = integrateOperationalGovernanceVisibility(completeInput({
      governanceStates: [
        ...completeInput().governanceStates,
        { source: "Optional Audit Notes", status: "PENDING", hash: null, present: false, required: false },
      ],
      replayReadiness: {
        replayable: true,
        sealLineageVisible: true,
        verificationLineageVisible: false,
        certificationLineageVisible: true,
        artifactContinuityVisible: true,
      },
    }));

    expect(result.integrationStatus).toBe("PARTIALLY_INTEGRATED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "OPTIONAL_GOVERNANCE_STATE_MISSING:Optional Audit Notes",
      "REPLAY_VISIBILITY_GAP:verificationLineageVisible",
    ]));
  });

  it("returns FAILED_INTEGRATION when required governance state is missing", () => {
    const result = integrateOperationalGovernanceVisibility(completeInput({
      sustainabilityStates: [
        { source: "Sustainability Final Seal", status: "SEALED", hash: "45bcd16", present: false, required: true },
      ],
    }));

    expect(result.integrationStatus).toBe("FAILED_INTEGRATION");
    expect(result.reasons).toContain("REQUIRED_SUSTAINABILITY_STATE_MISSING:Sustainability Final Seal");
  });

  it("returns DISPUTED_INTEGRATION for authority leakage while keeping output safe", () => {
    const result = integrateOperationalGovernanceVisibility(completeInput({
      evidence: {
        trusted: true,
        importedToLiveState: true,
        mayDeploy: true,
        mayRetry: true,
        mayRollback: true,
        mayCancel: true,
        mayResume: true,
        mayApprove: true,
        mayOverride: true,
        mayDelete: true,
        mayCompact: true,
        mayArchiveMutate: true,
        mayImportToLiveState: true,
      },
    }));

    expect(result.integrationStatus).toBe("DISPUTED_INTEGRATION");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "TRUSTED_STATE_LEAK:operationalGovernanceEvidence.trusted",
      "LIVE_IMPORT_LEAK:operationalGovernanceEvidence.importedToLiveState",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayDeploy",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayRetry",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayRollback",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayCancel",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayResume",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayApprove",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayOverride",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayDelete",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayCompact",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayImportToLiveState",
    ]));
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
    expect(result.mayDeploy).toBe(false);
    expect(result.mayRetry).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayCancel).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.mayApprove).toBe(false);
    expect(result.mayOverride).toBe(false);
    expect(result.mayDelete).toBe(false);
    expect(result.mayCompact).toBe(false);
    expect(result.mayArchiveMutate).toBe(false);
    expect(result.mayImportToLiveState).toBe(false);
  });

  it("does not mutate input", () => {
    const input = completeInput({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    const result = integrateOperationalGovernanceVisibility(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result.reasons).toEqual(["A_REASON", "Z_REASON"]);
  });
});
