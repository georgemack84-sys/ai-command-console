import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildGovernanceProgramCompletionReport,
  RECOMMENDED_GOVERNANCE_MAINTENANCE_TRACKS,
  REQUIRED_GOVERNANCE_PROGRAM_ADRS,
  REQUIRED_GOVERNANCE_PROGRAM_CHAINS,
  REQUIRED_GOVERNANCE_PROGRAM_DOCUMENTS,
  REQUIRED_GOVERNANCE_PROGRAM_SEALS,
  type GovernanceProgramCompletionReportInput,
} from "@/services/advisory/advisoryGovernanceProgramCompletionReport";

const generatedAt = "2026-06-01T12:00:00.000Z";

function completeInput(overrides: Partial<GovernanceProgramCompletionReportInput> = {}): GovernanceProgramCompletionReportInput {
  return {
    generatedAt,
    governanceSummary: {
      architectureSealed: true,
      verificationSealed: true,
      reviewSealed: true,
      documentationSealed: true,
      metaCertificationSealed: true,
      finalSealSealed: true,
    },
    completedChains: REQUIRED_GOVERNANCE_PROGRAM_CHAINS.map((chain) => ({
      ...chain,
      present: true,
    })),
    sealedCommits: REQUIRED_GOVERNANCE_PROGRAM_SEALS.map((seal) => ({
      ...seal,
      present: true,
    })),
    guarantees: {
      deterministic: true,
      readOnly: true,
      replayable: true,
      reviewable: true,
      documented: true,
      metaCertified: true,
      authorityContained: true,
      nonAuthoritative: true,
      nonMutating: true,
      trustedStateAbsent: true,
      liveImportAbsent: true,
      workflowControlAbsent: true,
    },
    documentationCoverage: REQUIRED_GOVERNANCE_PROGRAM_DOCUMENTS.map((item) => ({
      ...item,
      present: true,
    })),
    adrCoverage: REQUIRED_GOVERNANCE_PROGRAM_ADRS.map((item) => ({
      ...item,
      present: true,
    })),
    operatorWorkflowCoverage: [
      { item: "Operator handbook", required: true, present: true },
      { item: "Verification workflow", required: true, present: true },
      { item: "Seal history review", required: true, present: true },
    ],
    maintenanceTracks: RECOMMENDED_GOVERNANCE_MAINTENANCE_TRACKS.map((track) => ({
      ...track,
      present: true,
    })),
    reasons: ["GOVERNANCE_PROGRAM_COMPLETE"],
    ...overrides,
  };
}

describe("governance program completion report", () => {
  it("returns PROGRAM_COMPLETE for a complete sealed governance program", () => {
    const result = buildGovernanceProgramCompletionReport(completeInput());

    expect(result.programStatus).toBe("PROGRAM_COMPLETE");
    expect(result.programHash).toMatch(/^sha256:/);
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.completedChains.map((chain) => chain.chain)).toEqual([
      "Bundle Chain",
      "Completion Chain",
      "Documentation Chain",
      "Lifecycle Evidence Chain",
      "Meta-Certification Chain",
      "Review Chains",
      "Seal Chains",
    ]);
    expect(result.sealedCommits.map((seal) => seal.commit)).toEqual([
      "3674ed5",
      "44225dc",
      "5047239",
      "5b8ee3e",
      "a1bdfcb",
    ]);
    expect(result.governanceSummary.metaCertificationSealed).toBe(true);
    expect(result.documentationCoverage.every((item) => item.present)).toBe(true);
    expect(result.adrCoverage.every((item) => item.present)).toBe(true);
    expect(result.operatorWorkflowCoverage.every((item) => item.present)).toBe(true);
    expect(result.authority).toBe("READ_ONLY");
  });

  it("returns PROGRAM_CONDITIONAL when an optional maintenance track is missing", () => {
    const result = buildGovernanceProgramCompletionReport(completeInput({
      maintenanceTracks: [
        { track: "Documentation maintenance", optional: true, authoritative: false, runtime: false, present: false },
      ],
    }));

    expect(result.programStatus).toBe("PROGRAM_CONDITIONAL");
    expect(result.reasons).toContain("OPTIONAL_MAINTENANCE_TRACK_PENDING:Documentation maintenance");
  });

  it("returns PROGRAM_FAILED when a required governance chain is missing", () => {
    const result = buildGovernanceProgramCompletionReport(completeInput({
      completedChains: completeInput().completedChains.map((chain) => (
        chain.chain === "Meta-Certification Chain" ? { ...chain, present: false } : chain
      )),
    }));

    expect(result.programStatus).toBe("PROGRAM_FAILED");
    expect(result.reasons).toContain("REQUIRED_CHAIN_MISSING:Meta-Certification Chain");
  });

  it("returns PROGRAM_FAILED when required documentation or ADR coverage is missing", () => {
    const result = buildGovernanceProgramCompletionReport(completeInput({
      documentationCoverage: completeInput().documentationCoverage.map((item) => (
        item.item === "docs/architecture/seal-history.md" ? { ...item, present: false } : item
      )),
      adrCoverage: completeInput().adrCoverage.map((item) => (
        item.item === "docs/adr/ADR-0002-verification-before-review.md" ? { ...item, present: false } : item
      )),
    }));

    expect(result.programStatus).toBe("PROGRAM_FAILED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "REQUIRED_DOCUMENTATION_MISSING:docs/architecture/seal-history.md",
      "REQUIRED_ADR_MISSING:docs/adr/ADR-0002-verification-before-review.md",
    ]));
  });

  it("returns PROGRAM_DISPUTED for authority leakage while keeping output safe", () => {
    const result = buildGovernanceProgramCompletionReport(completeInput({
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

    expect(result.programStatus).toBe("PROGRAM_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "TRUSTED_STATE_LEAK:governanceProgramEvidence.trusted",
      "LIVE_IMPORT_LEAK:governanceProgramEvidence.importedToLiveState",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayDeploy",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayRetry",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayRollback",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayCancel",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayResume",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayApprove",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayOverride",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayDelete",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayCompact",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:governanceProgramEvidence.mayImportToLiveState",
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

  it("keeps programHash deterministic and excludes generatedAt", () => {
    const first = buildGovernanceProgramCompletionReport(completeInput({ generatedAt: "2026-06-01T12:00:00.000Z" }));
    const second = buildGovernanceProgramCompletionReport(completeInput({ generatedAt: "2026-06-02T12:00:00.000Z" }));

    expect(first.programHash).toBe(second.programHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("keeps authority fields false and does not mutate input", () => {
    const input = completeInput({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    const result = buildGovernanceProgramCompletionReport(input);

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

  it("adds no API route or governance completion action surface", () => {
    const root = process.cwd();

    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-program-completion"))).toBe(false);
    expect(fs.readdirSync(path.join(root, "components/advisory"))
      .filter((file) => /GovernanceCompletionAction/.test(file))).toEqual([]);
  });
});
