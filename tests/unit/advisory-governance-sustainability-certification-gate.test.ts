import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  certifyGovernanceSustainability,
  RECOMMENDED_GOVERNANCE_SUSTAINABILITY_TRACKS,
  type GovernanceSustainabilityCertificationInput,
} from "@/services/advisory/advisoryGovernanceSustainabilityCertificationGate";

const generatedAt = "2026-06-01T12:00:00.000Z";

function completeInput(overrides: Partial<GovernanceSustainabilityCertificationInput> = {}): GovernanceSustainabilityCertificationInput {
  return {
    generatedAt,
    maintenanceCoverage: {
      coverageVisible: true,
      gapsVisible: true,
      lineagePreserved: true,
    },
    sealPreservationCoverage: {
      sealChainCoverage: true,
      sealDependencyVisibility: true,
      sealContinuity: true,
      sealReplayability: true,
    },
    documentationSurvivability: {
      architectureDocumentationCoverage: true,
      operatorHandbookCoverage: true,
      verificationWorkflowCoverage: true,
      sealHistoryPreservation: true,
    },
    adrContinuity: {
      adrLineagePreserved: true,
      appendOnlyPreserved: true,
      supersessionRulesPreserved: true,
      decisionContinuityMaintained: true,
      rationalePreserved: true,
    },
    artifactPreservation: {
      sealedArtifactsRetained: true,
      deprecatedArtifactsMarked: true,
      lineageRetained: true,
      referencesRetained: true,
    },
    driftResistance: {
      governanceDriftExposureVisible: true,
      boundarySurvivability: true,
      authorityExpansionResistance: true,
      knowledgePreservation: true,
    },
    sustainabilityTracks: RECOMMENDED_GOVERNANCE_SUSTAINABILITY_TRACKS.map((track) => ({
      ...track,
      present: true,
    })),
    reasons: ["GOVERNANCE_SUSTAINABILITY_CERTIFIED"],
    ...overrides,
  };
}

describe("governance sustainability certification gate", () => {
  it("returns SUSTAINABILITY_CERTIFIED for full sustainability coverage", () => {
    const result = certifyGovernanceSustainability(completeInput());

    expect(result.sustainabilityStatus).toBe("SUSTAINABILITY_CERTIFIED");
    expect(result.sustainabilityHash).toMatch(/^sha256:/);
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.maintenanceCoverage.lineagePreserved).toBe(true);
    expect(result.sealPreservationCoverage.sealReplayability).toBe(true);
    expect(result.documentationSurvivability.operatorHandbookCoverage).toBe(true);
    expect(result.adrContinuity.appendOnlyPreserved).toBe(true);
    expect(result.artifactPreservation.sealedArtifactsRetained).toBe(true);
    expect(result.driftResistance.authorityExpansionResistance).toBe(true);
    expect(result.maintenanceReadinessScore).toBe(1);
    expect(result.preservationReadinessScore).toBe(1);
    expect(result.authority).toBe("READ_ONLY");
  });

  it("returns SUSTAINABILITY_CONDITIONAL when an optional sustainability track is missing", () => {
    const result = certifyGovernanceSustainability(completeInput({
      sustainabilityTracks: [
        { track: "ADR continuity review", optional: true, authoritative: false, runtime: false, present: false },
      ],
    }));

    expect(result.sustainabilityStatus).toBe("SUSTAINABILITY_CONDITIONAL");
    expect(result.reasons).toContain("OPTIONAL_SUSTAINABILITY_TRACK_PENDING:ADR continuity review");
  });

  it("returns SUSTAINABILITY_FAILED when a required sustainability domain is missing", () => {
    const result = certifyGovernanceSustainability(completeInput({
      adrContinuity: {
        adrLineagePreserved: true,
        appendOnlyPreserved: false,
        supersessionRulesPreserved: true,
        decisionContinuityMaintained: true,
        rationalePreserved: true,
      },
    }));

    expect(result.sustainabilityStatus).toBe("SUSTAINABILITY_FAILED");
    expect(result.reasons).toContain("REQUIRED_SUSTAINABILITY_DOMAIN_MISSING:adrContinuity.appendOnlyPreserved");
    expect(result.preservationReadinessScore).toBeLessThan(1);
  });

  it("returns SUSTAINABILITY_DISPUTED for authority leakage while keeping output safe", () => {
    const result = certifyGovernanceSustainability(completeInput({
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

    expect(result.sustainabilityStatus).toBe("SUSTAINABILITY_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "TRUSTED_STATE_LEAK:governanceSustainabilityEvidence.trusted",
      "LIVE_IMPORT_LEAK:governanceSustainabilityEvidence.importedToLiveState",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayDeploy",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayRetry",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayRollback",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayCancel",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayResume",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayApprove",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayOverride",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayDelete",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayCompact",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayImportToLiveState",
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

  it("disputes authoritative or runtime sustainability tracks", () => {
    const result = certifyGovernanceSustainability(completeInput({
      sustainabilityTracks: [
        { track: "Automated governance renewal", optional: true, authoritative: true, runtime: true, present: true },
      ],
    }));

    expect(result.sustainabilityStatus).toBe("SUSTAINABILITY_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "SUSTAINABILITY_TRACK_AUTHORITY_LEAK:Automated governance renewal",
      "SUSTAINABILITY_TRACK_RUNTIME_LEAK:Automated governance renewal",
    ]));
  });

  it("keeps sustainabilityHash deterministic and excludes generatedAt", () => {
    const first = certifyGovernanceSustainability(completeInput({ generatedAt: "2026-06-01T12:00:00.000Z" }));
    const second = certifyGovernanceSustainability(completeInput({ generatedAt: "2026-06-02T12:00:00.000Z" }));

    expect(first.sustainabilityHash).toBe(second.sustainabilityHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("keeps readiness scores deterministic", () => {
    const first = certifyGovernanceSustainability(completeInput({
      maintenanceCoverage: {
        coverageVisible: true,
        gapsVisible: false,
        lineagePreserved: true,
      },
      driftResistance: {
        governanceDriftExposureVisible: true,
        boundarySurvivability: false,
        authorityExpansionResistance: true,
        knowledgePreservation: true,
      },
    }));
    const second = certifyGovernanceSustainability(completeInput({
      maintenanceCoverage: {
        lineagePreserved: true,
        gapsVisible: false,
        coverageVisible: true,
      },
      driftResistance: {
        knowledgePreservation: true,
        authorityExpansionResistance: true,
        boundarySurvivability: false,
        governanceDriftExposureVisible: true,
      },
    }));

    expect(first.maintenanceReadinessScore).toBe(0.7143);
    expect(first.maintenanceReadinessScore).toBe(second.maintenanceReadinessScore);
    expect(first.sustainabilityHash).toBe(second.sustainabilityHash);
  });

  it("keeps authority fields false and does not mutate input", () => {
    const input = completeInput({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    const result = certifyGovernanceSustainability(input);

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

  it("adds no API route or sustainability action surface", () => {
    const root = process.cwd();

    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-sustainability"))).toBe(false);
    expect(fs.readdirSync(path.join(root, "components/advisory"))
      .filter((file) => /SustainabilityAction/.test(file))).toEqual([]);
  });
});
