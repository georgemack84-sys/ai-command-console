import { describe, expect, it } from "vitest";
import {
  buildInformationalFinding,
  buildOrchestrationFinding,
  buildSecurityValidatorResult,
  deriveSecurityDisposition,
  enforcePostNormalizationInvariants,
  evaluateSecurityGate,
  groupResultsByValidatorId,
  prepareNormalizedValidatorSet,
  validateResultConsistency,
} from "@/services/adaptive-memory-security-gate";
import type {
  FindingDispositionEffect,
  FrozenNormalizedValidatorSet,
  ResolvedValidatorRequirement,
  SecurityFinding,
  SecurityValidatorResult,
} from "@/types/adaptive-memory-security-gate";

const context = {
  evaluationId: "eval-001",
  tenantId: "tenant-alpha",
  memoryId: "memory-001",
  normalizerVersion: "security-gate-normalizer/v1",
  canonicalRequestHash: "request-hash-001",
  manifestVersion: "manifest/v1",
  validatorSetVersion: "validator-set/v1",
} as const;

const requirements: readonly ResolvedValidatorRequirement[] = Object.freeze([
  {
    validatorId: "integrity",
    validatorVersion: "1.0.0",
    criticality: "MANDATORY",
    applicable: true,
    executionOrder: 1,
    deterministicInputHash: "input-integrity",
  },
  {
    validatorId: "replay",
    validatorVersion: "1.0.0",
    criticality: "MANDATORY",
    applicable: true,
    executionOrder: 2,
    deterministicInputHash: "input-replay",
  },
  {
    validatorId: "poisoning",
    validatorVersion: "1.0.0",
    criticality: "SUPPLEMENTARY",
    applicable: true,
    executionOrder: 3,
    deterministicInputHash: "input-poisoning",
  },
]);

function finding(input: {
  validatorId: string;
  code: string;
  effect: FindingDispositionEffect;
  conclusive?: boolean;
}): SecurityFinding {
  return buildOrchestrationFinding({
    evaluationId: context.evaluationId,
    tenantId: context.tenantId,
    memoryId: context.memoryId,
    normalizerVersion: context.normalizerVersion,
    validatorId: input.validatorId,
    code: input.code,
    severity: input.effect === "INFORMATIONAL" ? "INFORMATIONAL" : "CRITICAL",
    dispositionEffect: input.effect,
    conclusive: input.conclusive ?? false,
    summary: input.code,
  });
}

function result(input: {
  validatorId: string;
  criticality?: "MANDATORY" | "SUPPLEMENTARY";
  version?: string;
  status?: SecurityValidatorResult["status"];
  completed?: boolean;
  findings?: readonly SecurityFinding[];
  inputHash?: string;
}): SecurityValidatorResult {
  return buildSecurityValidatorResult({
    validatorId: input.validatorId,
    validatorVersion: input.version ?? "1.0.0",
    criticality: input.criticality ?? "MANDATORY",
    applicable: true,
    completed: input.completed ?? true,
    status: input.status ?? "PASS",
    findings: input.findings ?? [buildInformationalFinding({
      tenantId: context.tenantId,
      memoryId: context.memoryId,
      validatorId: input.validatorId,
    })],
    evidenceReferences: [],
    normalizedFacts: [],
    deterministicInputHash: input.inputHash ?? `input-${input.validatorId}`,
  });
}

function baselineRaw(): readonly SecurityValidatorResult[] {
  return [
    result({ validatorId: "integrity" }),
    result({ validatorId: "replay" }),
    result({ validatorId: "poisoning", criticality: "SUPPLEMENTARY" }),
  ];
}

describe("Adaptive Memory Security Gate normalization boundary", () => {
  it("groups complete raw result sets by validator identity before acceptance", () => {
    const groups = groupResultsByValidatorId([
      result({ validatorId: "integrity" }),
      result({ validatorId: "replay" }),
      result({ validatorId: "integrity" }),
    ]);

    expect(groups.get("integrity")).toHaveLength(2);
    expect(groups.get("replay")).toHaveLength(1);
  });

  it("verifies all applicable mandatory validators pass from a frozen set", () => {
    const prepared = prepareNormalizedValidatorSet(baselineRaw(), requirements, context);

    expect(Object.isFrozen(prepared)).toBe(true);
    expect(prepared.frozen).toBe(true);
    expect(prepared.authoritativeResults).toHaveLength(3);
    expect(prepared.forensicResults).toHaveLength(0);
    expect(deriveSecurityDisposition(prepared)).toBe("VERIFIED");
  });

  it("rejects duplicate groups order-independently and preserves every duplicate forensics member", () => {
    const duplicateA = result({ validatorId: "integrity" });
    const duplicateB = result({ validatorId: "integrity", status: "FAIL", findings: [finding({ validatorId: "integrity", code: "RAW_REJECT", effect: "REJECT", conclusive: true })] });
    const rawOne = [duplicateA, result({ validatorId: "replay" }), duplicateB];
    const rawTwo = [duplicateB, result({ validatorId: "replay" }), duplicateA];

    const first = evaluateSecurityGate(rawOne, requirements, context);
    const second = evaluateSecurityGate(rawTwo, requirements, context);

    expect(first.disposition).toBe("QUARANTINED");
    expect(second.disposition).toBe("QUARANTINED");
    expect(first.validatorSet.authoritativeResultSetHash).toBe(second.validatorSet.authoritativeResultSetHash);
    expect(first.validatorSet.disqualifiedValidatorIds).toEqual(["integrity"]);
    expect(first.validatorSet.forensicResults.filter((item) => item.validatorId === "integrity")).toHaveLength(2);
    expect(first.validatorSet.authoritativeResults.find((item) => item.validatorId === "integrity")?.status).toBe("INDETERMINATE");
    expect(first.validatorSet.orchestrationFindings.some((item) => item.code === "DUPLICATE_VALIDATOR_RESULT")).toBe(true);
  });

  it("treats byte-identical duplicate mandatory results as duplicate and synthetic missing", () => {
    const duplicate = result({ validatorId: "integrity" });
    const evaluated = evaluateSecurityGate([duplicate, duplicate, result({ validatorId: "replay" })], requirements, context);

    expect(evaluated.validatorSet.disqualifiedValidatorIds).toEqual(["integrity"]);
    expect(evaluated.validatorSet.forensicResults.filter((item) => item.validatorId === "integrity")).toHaveLength(2);
    expect(evaluated.validatorSet.authoritativeResults.find((item) => item.validatorId === "integrity")?.findings[0].code).toBe("MISSING_MANDATORY_VALIDATOR_RESULT");
  });

  it("rejects unregistered, version-mismatched, and criticality-mismatched singleton results as absent", () => {
    const raw = [
      result({ validatorId: "unknown" }),
      result({ validatorId: "integrity", version: "old" }),
      result({ validatorId: "poisoning", criticality: "MANDATORY" }),
      result({ validatorId: "replay" }),
    ];
    const prepared = prepareNormalizedValidatorSet(raw, requirements, context);

    expect(prepared.orchestrationFindings.map((item) => item.code)).toEqual([
      "VALIDATOR_VERSION_MISMATCH",
      "VALIDATOR_CRITICALITY_MISMATCH",
      "UNREGISTERED_VALIDATOR_RESULT",
    ]);
    expect(prepared.forensicResults.map((item) => item.validatorId).sort()).toEqual(["integrity", "poisoning", "unknown"]);
    expect(prepared.authoritativeResults.find((item) => item.validatorId === "integrity")?.findings[0].code).toBe("MISSING_MANDATORY_VALIDATOR_RESULT");
  });

  it("keeps rejected forensic results out of disposition authority", () => {
    const raw = [
      result({ validatorId: "unknown", status: "FAIL", findings: [finding({ validatorId: "unknown", code: "FORENSIC_ONLY", effect: "REJECT", conclusive: true })] }),
      ...baselineRaw(),
    ];
    const evaluated = evaluateSecurityGate(raw, requirements, context);

    expect(evaluated.validatorSet.forensicResults.some((item) => item.validatorId === "unknown")).toBe(true);
    expect(evaluated.disposition).toBe("QUARANTINED");
    expect(evaluated.validatorSet.orchestrationFindings.some((item) => item.code === "UNREGISTERED_VALIDATOR_RESULT")).toBe(true);
  });

  it("validates status-and-finding consistency rules", () => {
    expect(validateResultConsistency(result({ validatorId: "integrity", findings: [finding({ validatorId: "integrity", code: "BLOCK", effect: "QUARANTINE" })] })).violationCode).toBe("PASS_WITH_BLOCKING_FINDING");
    expect(validateResultConsistency(result({ validatorId: "integrity", completed: false })).violationCode).toBe("INCOMPLETE_RESULT_RETURNED_PASS");
    expect(validateResultConsistency(result({ validatorId: "integrity", status: "SUSPICIOUS", findings: [] })).violationCode).toBe("SUSPICIOUS_WITHOUT_QUARANTINE_FINDING");
    expect(validateResultConsistency(result({ validatorId: "integrity", status: "FAIL", findings: [finding({ validatorId: "integrity", code: "Q", effect: "QUARANTINE" })] })).violationCode).toBe("FAIL_WITHOUT_CONCLUSIVE_REJECT_FINDING");
    expect(validateResultConsistency(result({ validatorId: "integrity", status: "INDETERMINATE", findings: [] })).violationCode).toBe("INDETERMINATE_WITHOUT_EXPLANATION");
  });

  it("normalizes inconsistent mandatory results to indeterminate without promoting raw severity", () => {
    const rawReject = result({
      validatorId: "integrity",
      status: "PASS",
      findings: [finding({ validatorId: "integrity", code: "RAW_REJECT", effect: "REJECT", conclusive: true })],
    });
    const evaluated = evaluateSecurityGate([rawReject, result({ validatorId: "replay" })], requirements, context);
    const normalized = evaluated.validatorSet.authoritativeResults.find((item) => item.validatorId === "integrity");

    expect(normalized?.status).toBe("INDETERMINATE");
    expect(normalized?.completed).toBe(false);
    expect(normalized?.findings.some((item) => item.code === "MANDATORY_RESULT_INCONSISTENT_PASS_WITH_BLOCKING_FINDING")).toBe(true);
    expect(evaluated.disposition).toBe("QUARANTINED");
  });

  it("normalizes supplementary bare failures and suspicions with gate-generated findings", () => {
    const bareFail = result({ validatorId: "poisoning", criticality: "SUPPLEMENTARY", status: "FAIL", findings: [] });
    const bareSuspicious = result({ validatorId: "poisoning", criticality: "SUPPLEMENTARY", status: "SUSPICIOUS", findings: [] });

    const failPrepared = prepareNormalizedValidatorSet([result({ validatorId: "integrity" }), result({ validatorId: "replay" }), bareFail], requirements, context);
    const suspiciousPrepared = prepareNormalizedValidatorSet([result({ validatorId: "integrity" }), result({ validatorId: "replay" }), bareSuspicious], requirements, context);

    expect(failPrepared.authoritativeResults.find((item) => item.validatorId === "poisoning")?.findings[0].code).toBe("SUPPLEMENTARY_FAILURE_WITHOUT_FINDINGS");
    expect(suspiciousPrepared.authoritativeResults.find((item) => item.validatorId === "poisoning")?.findings[0].code).toBe("SUPPLEMENTARY_SUSPICION_WITHOUT_FINDINGS");
  });

  it("invariant enforcement replaces malformed normalized output and makes original findings forensic-only", () => {
    const malformed = result({
      validatorId: "integrity",
      status: "FAIL",
      findings: [finding({ validatorId: "integrity", code: "NONCONCLUSIVE_REJECT", effect: "REJECT", conclusive: false })],
    });
    const outcome = enforcePostNormalizationInvariants(malformed, context);

    expect(outcome.authoritativeResult.status).toBe("INDETERMINATE");
    expect(outcome.authoritativeResult.completed).toBe(false);
    expect(outcome.authoritativeResult.evidenceReferences).toHaveLength(0);
    expect(outcome.authoritativeResult.normalizedFacts).toHaveLength(0);
    expect(outcome.authoritativeResult.findings.every((item) => item.code === "NORMALIZED_RESULT_INVARIANT_VIOLATION")).toBe(true);
    expect(outcome.forensicResult?.findings[0].code).toBe("NONCONCLUSIVE_REJECT");
  });

  it("forensic conclusive reject cannot independently reject, while authoritative reject can", () => {
    const forensicOnly = evaluateSecurityGate([
      result({ validatorId: "unknown", status: "FAIL", findings: [finding({ validatorId: "unknown", code: "FORENSIC_REJECT", effect: "REJECT", conclusive: true })] }),
      ...baselineRaw(),
    ], requirements, context);
    const authoritativeReject = evaluateSecurityGate([
      result({ validatorId: "integrity", status: "FAIL", findings: [finding({ validatorId: "integrity", code: "AUTH_REJECT", effect: "REJECT", conclusive: true })] }),
      result({ validatorId: "replay" }),
    ], requirements, context);

    expect(forensicOnly.disposition).toBe("QUARANTINED");
    expect(authoritativeReject.disposition).toBe("REJECTED");
  });

  it("creates tenant-scoped and memory-scoped deterministic synthetic finding IDs", () => {
    const first = prepareNormalizedValidatorSet([result({ validatorId: "replay" })], requirements, context);
    const replay = prepareNormalizedValidatorSet([result({ validatorId: "replay" })], requirements, context);
    const otherMemory = prepareNormalizedValidatorSet([result({ validatorId: "replay" })], requirements, { ...context, memoryId: "memory-002" });
    const synthetic = first.authoritativeResults.find((item) => item.validatorId === "integrity")?.findings[0];

    expect(synthetic?.tenantId).toBe("tenant-alpha");
    expect(synthetic?.memoryId).toBe("memory-001");
    expect(synthetic?.findingId).toBe(replay.authoritativeResults.find((item) => item.validatorId === "integrity")?.findings[0].findingId);
    expect(synthetic?.findingId).not.toBe(otherMemory.authoritativeResults.find((item) => item.validatorId === "integrity")?.findings[0].findingId);
  });

  it("derives every disposition from authoritative frozen data only", () => {
    const suspicious = prepareNormalizedValidatorSet([
      result({ validatorId: "integrity", status: "SUSPICIOUS", findings: [finding({ validatorId: "integrity", code: "Q", effect: "QUARANTINE" })] }),
      result({ validatorId: "replay" }),
    ], requirements, context);
    const indeterminate = prepareNormalizedValidatorSet([result({ validatorId: "replay" })], requirements, context);
    const noMandatory = prepareNormalizedValidatorSet([result({ validatorId: "poisoning", criticality: "SUPPLEMENTARY" })], [requirements[2]], context);

    expect(deriveSecurityDisposition(suspicious)).toBe("QUARANTINED");
    expect(deriveSecurityDisposition(indeterminate)).toBe("QUARANTINED");
    expect(deriveSecurityDisposition(noMandatory)).toBe("QUARANTINED");
  });

  it("does not allow mutable or raw-shaped values to produce verified", () => {
    const mutable = {
      authoritativeResults: baselineRaw(),
      orchestrationFindings: [],
      forensicResults: [],
      disqualifiedValidatorIds: [],
      authoritativeResultSetHash: "hash",
      forensicEvidenceHash: "hash",
      normalizerVersion: context.normalizerVersion,
      frozen: true,
    } as FrozenNormalizedValidatorSet;

    expect(deriveSecurityDisposition(mutable)).toBe("QUARANTINED");
  });

  it("changes decision-relevant replay metadata when normalizer version changes", () => {
    const first = prepareNormalizedValidatorSet(baselineRaw(), requirements, context);
    const second = prepareNormalizedValidatorSet(baselineRaw(), requirements, { ...context, normalizerVersion: "security-gate-normalizer/v2" });

    expect(first.authoritativeResultSetHash).not.toBe(second.authoritativeResultSetHash);
    expect(first.forensicEvidenceHash).toBe(second.forensicEvidenceHash);
  });

  it("prevents mutation of frozen normalized sets", () => {
    const prepared = prepareNormalizedValidatorSet(baselineRaw(), requirements, context);

    expect(() => {
      (prepared.authoritativeResults as SecurityValidatorResult[]).push(result({ validatorId: "new" }));
    }).toThrow();
    expect(prepared.authoritativeResults).toHaveLength(3);
  });
});
