import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  certifyAdvisoryGovernanceProcess,
  OPTIONAL_GOVERNANCE_META_DOCUMENTS,
  REQUIRED_GOVERNANCE_META_DOCUMENTS,
  REQUIRED_GOVERNANCE_META_SEALS,
  type GovernanceMetaCertificationInput,
} from "@/services/advisory/advisoryGovernanceMetaCertification";

const certifiedAt = "2026-06-01T12:00:00.000Z";

function completeInput(overrides: Partial<GovernanceMetaCertificationInput> = {}): GovernanceMetaCertificationInput {
  return {
    certifiedAt,
    documentedArtifacts: [
      ...REQUIRED_GOVERNANCE_META_DOCUMENTS.map((artifact) => ({
        ...artifact,
        present: true,
      })),
      ...OPTIONAL_GOVERNANCE_META_DOCUMENTS.map((artifact) => ({
        ...artifact,
        present: true,
      })),
    ],
    sealedCommits: REQUIRED_GOVERNANCE_META_SEALS.map((seal) => ({
      ...seal,
      present: true,
    })),
    reasons: [],
    ...overrides,
  };
}

describe("advisory governance meta-certification", () => {
  it("returns META_CERTIFIED for a complete governance process", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput());

    expect(result.metaCertificationStatus).toBe("META_CERTIFIED");
    expect(result.metaCertificationHash).toMatch(/^sha256:/);
    expect(result.certifiedAt).toBe(certifiedAt);
    expect(result.processChecks).toEqual({
      certificationGatePresent: true,
      completionReportPresent: true,
      completionBundleVerificationPresent: true,
      documentationPresent: true,
      adrCoveragePresent: true,
      sealHistoryPresent: true,
      verificationBeforeReviewPreserved: true,
      noLiveImportPreserved: true,
      noTrustedStatePreserved: true,
      authorityContainmentPreserved: true,
    });
    expect(result.documentedArtifacts.every((artifact) => artifact.present || !artifact.required)).toBe(true);
    expect(result.sealedCommits.every((seal) => seal.present)).toBe(true);
    expect(result.authority).toBe("READ_ONLY");
    expect(result.reasons).toEqual([]);
  });

  it("returns META_CONDITIONAL when optional documentation is missing", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput({
      documentedArtifacts: [
        ...REQUIRED_GOVERNANCE_META_DOCUMENTS.map((artifact) => ({
          ...artifact,
          present: true,
        })),
        ...OPTIONAL_GOVERNANCE_META_DOCUMENTS.map((artifact) => ({
          ...artifact,
          present: false,
        })),
      ],
    }));

    expect(result.metaCertificationStatus).toBe("META_CONDITIONAL");
    expect(result.reasons).toContain("OPTIONAL_DOCUMENT_MISSING:docs/architecture/maintenance-notes.md");
  });

  it("returns META_FAILED when a required ADR is missing", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput({
      documentedArtifacts: completeInput().documentedArtifacts.map((artifact) => (
        artifact.path === "docs/adr/ADR-0002-verification-before-review.md"
          ? { ...artifact, present: false }
          : artifact
      )),
    }));

    expect(result.metaCertificationStatus).toBe("META_FAILED");
    expect(result.processChecks.adrCoveragePresent).toBe(false);
    expect(result.processChecks.verificationBeforeReviewPreserved).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "REQUIRED_DOCUMENT_MISSING:docs/adr/ADR-0002-verification-before-review.md",
      "PROCESS_CHECK_FAILED:adrCoveragePresent",
      "PROCESS_CONTRADICTION:verificationBeforeReview",
    ]));
  });

  it("returns META_FAILED when a required seal is missing", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput({
      sealedCommits: completeInput().sealedCommits.map((seal) => (
        seal.commit === "560d39f" ? { ...seal, present: false } : seal
      )),
    }));

    expect(result.metaCertificationStatus).toBe("META_FAILED");
    expect(result.processChecks.completionBundleVerificationPresent).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "REQUIRED_SEAL_MISSING:560d39f",
      "PROCESS_CHECK_FAILED:completionBundleVerificationPresent",
    ]));
  });

  it("returns META_DISPUTED for authority leakage while keeping output safe", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput({
      evidence: {
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

    expect(result.metaCertificationStatus).toBe("META_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayDeploy",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayRetry",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayRollback",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayCancel",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayResume",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayApprove",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayOverride",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayDelete",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayCompact",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayImportToLiveState",
    ]));
    expect(result.authority).toBe("READ_ONLY");
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

  it("returns META_DISPUTED for trusted state and live import leakage", () => {
    const result = certifyAdvisoryGovernanceProcess(completeInput({
      evidence: {
        trusted: true,
        importedToLiveState: true,
      },
    }));

    expect(result.metaCertificationStatus).toBe("META_DISPUTED");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "TRUSTED_STATE_LEAK:metaCertificationEvidence.trusted",
      "LIVE_IMPORT_LEAK:metaCertificationEvidence.importedToLiveState",
    ]));
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
  });

  it("keeps metaCertificationHash deterministic and excludes certifiedAt", () => {
    const first = certifyAdvisoryGovernanceProcess(completeInput({ certifiedAt: "2026-06-01T12:00:00.000Z" }));
    const second = certifyAdvisoryGovernanceProcess(completeInput({ certifiedAt: "2026-06-02T12:00:00.000Z" }));

    expect(first.metaCertificationHash).toBe(second.metaCertificationHash);
    expect(first.certifiedAt).not.toBe(second.certifiedAt);
  });

  it("does not mutate input", () => {
    const input = completeInput({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    const result = certifyAdvisoryGovernanceProcess(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result.reasons).toEqual(["A_REASON", "Z_REASON"]);
  });

  it("fails closed for malformed input and adds no API or UI surface", () => {
    const result = certifyAdvisoryGovernanceProcess({ documentedArtifacts: "bad", sealedCommits: [] });

    expect(result.metaCertificationStatus).toBe("META_FAILED");
    expect(result.processChecks.documentationPresent).toBe(false);
    expect(result.processChecks.adrCoveragePresent).toBe(false);
    expect(result.reasons).toContain("META_CERTIFICATION_INPUT_MALFORMED");
    expect(Object.keys(result)).not.toEqual(expect.arrayContaining([
      "route",
      "component",
      "serverAction",
      "writePath",
      "liveAdvisoryState",
      "trustedImport",
    ]));
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/governance-meta-certification/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "components/advisory/AdvisoryGovernanceMetaCertificationPanel.tsx"))).toBe(false);
  });
});
