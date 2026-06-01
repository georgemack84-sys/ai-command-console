import { describe, expect, it } from "vitest";

import {
  certifyAdvisoryEvidenceLifecycle,
  REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_PHASES,
  type AdvisoryEvidenceLifecycleCertificationInput,
} from "@/services/advisory/advisoryEvidenceLifecycleCertificationGate";

const certifiedAt = "2026-05-31T12:00:00.000Z";

function completeInput(overrides: Partial<AdvisoryEvidenceLifecycleCertificationInput> = {}): AdvisoryEvidenceLifecycleCertificationInput {
  return {
    certifiedAt,
    certifiedChain: REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_PHASES.map((phase) => ({
      phase: phase.phase,
      commit: phase.commit,
      required: phase.required,
      present: true,
    })),
    checks: {
      deterministic: true,
      readOnly: true,
      replayable: true,
      operatorVisible: true,
      authorityContained: true,
      trustedStateAbsent: true,
      liveImportAbsent: true,
      lifecycleActionsAbsent: true,
      workflowControlAbsent: true,
      buildClean: true,
    },
    reasons: ["CERTIFICATION_INPUT_COMPLETE"],
    ...overrides,
  };
}

describe("advisory evidence lifecycle certification gate", () => {
  it("certifies the complete sealed lifecycle", () => {
    const result = certifyAdvisoryEvidenceLifecycle(completeInput());

    expect(result.certificationStatus).toBe("CERTIFIED");
    expect(result.certificationHash).toMatch(/^sha256:/);
    expect(result.certifiedAt).toBe(certifiedAt);
    expect(result.certifiedChain.every((phase) => phase.present)).toBe(true);
    expect(result.checks).toEqual(completeInput().checks);
    expect(result.authority).toBe("READ_ONLY");
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
  });

  it("returns CONDITIONAL_CERTIFICATION when optional evidence is absent", () => {
    const result = certifyAdvisoryEvidenceLifecycle(completeInput({
      certifiedChain: [
        ...completeInput().certifiedChain,
        {
          phase: "Optional Evidence Note",
          commit: null,
          required: false,
          present: false,
        },
      ],
    }));

    expect(result.certificationStatus).toBe("CONDITIONAL_CERTIFICATION");
    expect(result.reasons).toContain("OPTIONAL_PHASE_MISSING:Optional Evidence Note");
  });

  it("returns CERTIFICATION_FAILED when a required phase is missing", () => {
    const input = completeInput({
      certifiedChain: completeInput().certifiedChain.map((phase) => (
        phase.phase === "Lifecycle Bundle Verification" ? { ...phase, present: false } : phase
      )),
    });

    const result = certifyAdvisoryEvidenceLifecycle(input);

    expect(result.certificationStatus).toBe("CERTIFICATION_FAILED");
    expect(result.reasons).toContain("REQUIRED_PHASE_MISSING:Lifecycle Bundle Verification");
  });

  it("returns CERTIFICATION_FAILED for malformed input", () => {
    const result = certifyAdvisoryEvidenceLifecycle(null);

    expect(result.certificationStatus).toBe("CERTIFICATION_FAILED");
    expect(result.reasons).toContain("CERTIFICATION_INPUT_MALFORMED");
  });

  it("disputes authority trusted live import lifecycle action and workflow control leaks", () => {
    const cases = [
      completeInput({ evidence: { mayDeploy: true } }),
      completeInput({ evidence: { trusted: true } }),
      completeInput({ evidence: { importedToLiveState: true } }),
      completeInput({ evidence: { mayDelete: true } }),
      completeInput({ checks: { ...completeInput().checks, workflowControlAbsent: false } }),
    ];

    for (const input of cases) {
      const result = certifyAdvisoryEvidenceLifecycle(input);
      expect(result.certificationStatus).toBe("CERTIFICATION_DISPUTED");
      expect(result.authority).toBe("READ_ONLY");
      expect(result.trusted).toBe(false);
      expect(result.importedToLiveState).toBe(false);
      expect(result.mayDeploy).toBe(false);
      expect(result.mayDelete).toBe(false);
    }
  });

  it("keeps certification hashes deterministic and excludes certifiedAt", () => {
    const first = certifyAdvisoryEvidenceLifecycle(completeInput({ certifiedAt: "2026-05-31T12:00:00.000Z" }));
    const second = certifyAdvisoryEvidenceLifecycle(completeInput({ certifiedAt: "2026-06-01T12:00:00.000Z" }));

    expect(first.certificationHash).toBe(second.certificationHash);
    expect(first.certifiedAt).not.toBe(second.certifiedAt);
  });

  it("keeps all authority fields false and does not mutate input", () => {
    const input = completeInput();
    const before = JSON.stringify(input);
    const result = certifyAdvisoryEvidenceLifecycle(input);

    expect(JSON.stringify(input)).toBe(before);
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
});
