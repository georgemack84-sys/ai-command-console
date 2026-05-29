import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { ReleaseCertificate, ReleaseCertificateInput, ReleaseCertificateResult } from "./types";

export const RELEASE_CERTIFICATE_VERSION = "1.0" as const;

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export function buildCertificatePreimage(input: Omit<ReleaseCertificate, "certificateHash">) {
  return {
    certificateVersion: input.certificateVersion,
    releaseId: input.releaseId,
    commitSha: input.commitSha,
    testHash: input.testHash,
    artifactHash: input.artifactHash,
    governanceStatus: input.governanceStatus,
    residueResult: input.residueResult,
    approvalLineage: [...input.approvalLineage],
    generatedAt: input.generatedAt,
  } as const;
}

export function hashReleaseCertificate(input: Omit<ReleaseCertificate, "certificateHash">) {
  return sha256(buildCertificatePreimage(input));
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateReleaseCertificateCandidate(input: ReleaseCertificateInput): readonly string[] {
  const reasons: string[] = [];

  if (!isNonEmptyString(input.releaseId)) reasons.push("RELEASE_ID_MISSING");
  if (!isNonEmptyString(input.commitSha)) reasons.push("COMMIT_SHA_MISSING");
  if (!isNonEmptyString(input.testHash)) reasons.push("TEST_HASH_MISSING");
  if (!isNonEmptyString(input.artifactHash)) reasons.push("ARTIFACT_HASH_MISSING");
  if (!isNonEmptyString(input.generatedAt)) reasons.push("GENERATED_AT_MISSING");
  if (input.governanceStatus !== "PASSED") reasons.push("GOVERNANCE_NOT_PASSED");
  if (input.residueResult !== "CLEAN") reasons.push("RESIDUE_NOT_CLEAN");
  if (!Array.isArray(input.approvalLineage) || input.approvalLineage.filter(isNonEmptyString).length === 0) {
    reasons.push("APPROVAL_LINEAGE_MISSING");
  }

  return reasons;
}

export function issueReleaseCertificate(input: ReleaseCertificateInput): ReleaseCertificateResult {
  const reasons = validateReleaseCertificateCandidate(input);
  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  const base = {
    certificateVersion: input.certificateVersion || RELEASE_CERTIFICATE_VERSION,
    releaseId: input.releaseId,
    commitSha: input.commitSha,
    testHash: input.testHash,
    artifactHash: input.artifactHash,
    governanceStatus: input.governanceStatus,
    residueResult: input.residueResult,
    approvalLineage: [...input.approvalLineage],
    generatedAt: input.generatedAt,
  } as const;

  return {
    ok: true,
    certificate: deepFreeze({
      ...base,
      certificateHash: hashReleaseCertificate(base),
    }),
  };
}

export function validateIssuedReleaseCertificate(certificate: ReleaseCertificate): readonly string[] {
  const reasons: string[] = [];
  const candidateReasons = validateReleaseCertificateCandidate(certificate);
  reasons.push(...candidateReasons);

  if (certificate.certificateVersion !== RELEASE_CERTIFICATE_VERSION) {
    reasons.push("CERTIFICATE_VERSION_UNSUPPORTED");
  }

  if (!isNonEmptyString(certificate.certificateHash) || certificate.certificateHash !== hashReleaseCertificate(certificate)) {
    reasons.push("CERTIFICATE_HASH_INVALID");
  }

  return [...new Set(reasons)];
}

export function hashReleaseValue(value: unknown) {
  return sha256(value);
}
