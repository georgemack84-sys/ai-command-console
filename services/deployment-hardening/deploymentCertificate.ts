import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type {
  DeploymentCertificate,
  DeploymentCertificateInput,
  DeploymentCertificateResult,
} from "./types";

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildDeploymentCertificatePreimage(input: DeploymentCertificateInput) {
  return {
    commitSHA: input.commitSHA,
    workflowRunId: input.workflowRunId,
    testHash: input.testHash,
    residueStatus: input.residueStatus,
    governanceStatus: input.governanceStatus,
    approvalLineage: [...input.approvalLineage],
    timestamp: input.timestamp,
  } as const;
}

export function hashDeploymentCertificate(input: DeploymentCertificateInput) {
  return sha256(buildDeploymentCertificatePreimage(input));
}

export function validateDeploymentCertificateInput(input?: DeploymentCertificateInput): readonly string[] {
  const reasons: string[] = [];

  if (!input) return ["CERTIFICATE_MISSING"];
  if (!isNonEmptyString(input.commitSHA)) reasons.push("COMMIT_SHA_MISSING");
  if (!isNonEmptyString(input.workflowRunId)) reasons.push("WORKFLOW_RUN_ID_MISSING");
  if (!isNonEmptyString(input.testHash)) reasons.push("TEST_HASH_MISSING");
  if (!isNonEmptyString(input.timestamp)) reasons.push("CERTIFICATE_TIMESTAMP_MISSING");
  if (input.residueStatus !== "CLEAN") reasons.push("RESIDUE_NOT_CLEAN");
  if (input.governanceStatus !== "PASSED") reasons.push("GOVERNANCE_NOT_PASSED");
  if (!Array.isArray(input.approvalLineage) || input.approvalLineage.filter(isNonEmptyString).length === 0) {
    reasons.push("APPROVAL_LINEAGE_MISSING");
  }

  return reasons;
}

export function issueDeploymentHardeningCertificate(input: DeploymentCertificateInput): DeploymentCertificateResult {
  const reasons = validateDeploymentCertificateInput(input);
  if (reasons.length > 0) {
    return Object.freeze({ ok: false as const, reasons: Object.freeze([...reasons]) });
  }

  return Object.freeze({
    ok: true as const,
    certificate: deepFreeze({
      ...input,
      approvalLineage: [...input.approvalLineage],
      certificateHash: hashDeploymentCertificate(input),
    }),
  });
}

export function validateDeploymentCertificate(certificate?: DeploymentCertificate): readonly string[] {
  if (!certificate) return ["CERTIFICATE_MISSING"];
  const reasons = [...validateDeploymentCertificateInput(certificate)];
  if (certificate.certificateHash !== hashDeploymentCertificate(certificate)) {
    reasons.push("CERTIFICATE_HASH_INVALID");
  }
  return [...new Set(reasons)];
}
