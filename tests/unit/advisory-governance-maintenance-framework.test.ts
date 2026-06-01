import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildGovernanceMaintenanceFramework,
  RECOMMENDED_GOVERNANCE_MAINTENANCE_FRAMEWORK_TRACKS,
  type GovernanceMaintenanceFrameworkInput,
} from "@/services/advisory/advisoryGovernanceMaintenanceFramework";

const generatedAt = "2026-06-01T12:00:00.000Z";

function completeInput(overrides: Partial<GovernanceMaintenanceFrameworkInput> = {}): GovernanceMaintenanceFrameworkInput {
  return {
    generatedAt,
    sealMaintenancePolicy: {
      sealVerificationRequired: true,
      regressionVerificationRequired: true,
      dependencyValidationRequired: true,
      driftDetectionGuidanceOnly: true,
    },
    documentationMaintenancePolicy: {
      reviewCadenceGuidance: true,
      coverageExpectations: true,
      linkValidationExpectations: true,
      sealReferenceValidation: true,
    },
    adrMaintenancePolicy: {
      appendOnly: true,
      supersedeInsteadOfEdit: true,
      preserveRationale: true,
      preserveLineage: true,
    },
    regressionMaintenancePolicy: {
      requiredRegressionBundles: true,
      sealBlockingRegressions: true,
      validationRequirements: true,
      buildExpectations: true,
    },
    artifactDeprecationPolicy: {
      neverDeleteSealedArtifacts: true,
      markDeprecated: true,
      retainLineage: true,
      retainReferences: true,
    },
    auditCadencePolicy: {
      documentationOnly: true,
      optionalGuidance: true,
      nonRuntime: true,
      nonEnforced: true,
    },
    maintenanceTracks: RECOMMENDED_GOVERNANCE_MAINTENANCE_FRAMEWORK_TRACKS.map((track) => ({
      ...track,
      present: true,
    })),
    reasons: ["GOVERNANCE_MAINTENANCE_READY"],
    ...overrides,
  };
}

describe("governance maintenance framework", () => {
  it("returns MAINTENANCE_READY for a complete maintenance framework", () => {
    const result = buildGovernanceMaintenanceFramework(completeInput());

    expect(result.maintenanceStatus).toBe("MAINTENANCE_READY");
    expect(result.maintenanceHash).toMatch(/^sha256:/);
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.sealMaintenancePolicy).toEqual({
      sealVerificationRequired: true,
      regressionVerificationRequired: true,
      dependencyValidationRequired: true,
      driftDetectionGuidanceOnly: true,
    });
    expect(result.documentationMaintenancePolicy.sealReferenceValidation).toBe(true);
    expect(result.adrMaintenancePolicy.appendOnly).toBe(true);
    expect(result.adrMaintenancePolicy.supersedeInsteadOfEdit).toBe(true);
    expect(result.regressionMaintenancePolicy.sealBlockingRegressions).toBe(true);
    expect(result.artifactDeprecationPolicy.neverDeleteSealedArtifacts).toBe(true);
    expect(result.auditCadencePolicy.documentationOnly).toBe(true);
    expect(result.auditCadencePolicy.nonRuntime).toBe(true);
    expect(result.authority).toBe("READ_ONLY");
  });

  it("returns MAINTENANCE_CONDITIONAL when an optional maintenance track is missing", () => {
    const result = buildGovernanceMaintenanceFramework(completeInput({
      maintenanceTracks: [
        { track: "ADR maintenance", optional: true, authoritative: false, runtime: false, present: false },
      ],
    }));

    expect(result.maintenanceStatus).toBe("MAINTENANCE_CONDITIONAL");
    expect(result.reasons).toContain("OPTIONAL_MAINTENANCE_TRACK_PENDING:ADR maintenance");
  });

  it("returns MAINTENANCE_FAILED when a required policy is missing", () => {
    const result = buildGovernanceMaintenanceFramework(completeInput({
      adrMaintenancePolicy: {
        appendOnly: false,
        supersedeInsteadOfEdit: true,
        preserveRationale: true,
        preserveLineage: true,
      },
    }));

    expect(result.maintenanceStatus).toBe("MAINTENANCE_FAILED");
    expect(result.reasons).toContain("REQUIRED_POLICY_MISSING:adrMaintenancePolicy.appendOnly");
  });

  it("returns MAINTENANCE_DISPUTED for authority leakage while keeping output safe", () => {
    const result = buildGovernanceMaintenanceFramework(completeInput({
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

    expect(result.maintenanceStatus).toBe("MAINTENANCE_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "TRUSTED_STATE_LEAK:governanceMaintenanceEvidence.trusted",
      "LIVE_IMPORT_LEAK:governanceMaintenanceEvidence.importedToLiveState",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayDeploy",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayRetry",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayRollback",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayCancel",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayResume",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayApprove",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayOverride",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayDelete",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayCompact",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:governanceMaintenanceEvidence.mayImportToLiveState",
    ]));
    expect(result.authority).toBe("READ_ONLY");
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

  it("disputes authoritative or runtime maintenance tracks", () => {
    const result = buildGovernanceMaintenanceFramework(completeInput({
      maintenanceTracks: [
        { track: "Governance automation", optional: true, authoritative: true, runtime: true, present: true },
      ],
    }));

    expect(result.maintenanceStatus).toBe("MAINTENANCE_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "MAINTENANCE_TRACK_AUTHORITY_LEAK:Governance automation",
      "MAINTENANCE_TRACK_RUNTIME_LEAK:Governance automation",
    ]));
  });

  it("keeps maintenanceHash deterministic and excludes generatedAt", () => {
    const first = buildGovernanceMaintenanceFramework(completeInput({ generatedAt: "2026-06-01T12:00:00.000Z" }));
    const second = buildGovernanceMaintenanceFramework(completeInput({ generatedAt: "2026-06-02T12:00:00.000Z" }));

    expect(first.maintenanceHash).toBe(second.maintenanceHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("keeps authority fields false and does not mutate input", () => {
    const input = completeInput({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    const result = buildGovernanceMaintenanceFramework(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result.reasons).toEqual(["A_REASON", "Z_REASON"]);
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

  it("adds no API route or maintenance action surface", () => {
    const root = process.cwd();

    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-maintenance"))).toBe(false);
    expect(fs.readdirSync(path.join(root, "components/advisory"))
      .filter((file) => /MaintenanceAction/.test(file))).toEqual([]);
  });
});
