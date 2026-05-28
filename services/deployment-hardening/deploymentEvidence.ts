import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type {
  DeploymentEvidenceBundle,
  DeploymentEvidenceReplayResult,
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

function evidencePreimage(evidence: Omit<DeploymentEvidenceBundle, "evidenceHash">) {
  return {
    evidenceVersion: evidence.evidenceVersion,
    deploymentId: evidence.deploymentId,
    workflowId: evidence.workflowId,
    workflowRunId: evidence.workflowRunId,
    commitSHA: evidence.commitSHA,
    state: evidence.state,
    failureClass: evidence.failureClass ?? null,
    telemetry: evidence.telemetry,
    certificate: evidence.certificate ?? null,
    checkpoint: evidence.checkpoint,
    logs: [...evidence.logs],
    artifacts: [...evidence.artifacts],
    stateTransitions: [...evidence.stateTransitions],
    reasons: [...evidence.reasons],
  } as const;
}

export function hashDeploymentEvidence(evidence: Omit<DeploymentEvidenceBundle, "evidenceHash">) {
  return sha256(evidencePreimage(evidence));
}

export function freezeDeploymentEvidence(evidence: Omit<DeploymentEvidenceBundle, "evidenceHash">) {
  return deepFreeze({
    ...evidence,
    evidenceHash: hashDeploymentEvidence(evidence),
  });
}

export function verifyDeploymentEvidenceReplay(evidence?: DeploymentEvidenceBundle): DeploymentEvidenceReplayResult {
  if (!evidence) {
    return {
      ok: false,
      status: "NOT_REPLAYABLE",
      missingEvidence: ["deployment-hardening-evidence"],
      hashMismatches: [],
      evidenceHash: "",
    };
  }

  const missingEvidence: string[] = [];
  if (!evidence.logs || evidence.logs.length === 0) missingEvidence.push("logs");
  if (!evidence.certificate) missingEvidence.push("certificate");
  if (!evidence.telemetry) missingEvidence.push("telemetry");
  if (!evidence.stateTransitions || evidence.stateTransitions.length === 0) {
    missingEvidence.push("stateTransitions");
  }

  const expectedHash = hashDeploymentEvidence({
    evidenceVersion: evidence.evidenceVersion,
    deploymentId: evidence.deploymentId,
    workflowId: evidence.workflowId,
    workflowRunId: evidence.workflowRunId,
    commitSHA: evidence.commitSHA,
    state: evidence.state,
    failureClass: evidence.failureClass,
    telemetry: evidence.telemetry,
    certificate: evidence.certificate,
    checkpoint: evidence.checkpoint,
    logs: evidence.logs,
    artifacts: evidence.artifacts,
    stateTransitions: evidence.stateTransitions,
    reasons: evidence.reasons,
  });
  const hashMismatches = expectedHash === evidence.evidenceHash ? [] : ["deployment-hardening-evidence"];

  return {
    ok: missingEvidence.length === 0 && hashMismatches.length === 0,
    status: hashMismatches.length > 0 ? "DISPUTED" : missingEvidence.length > 0 ? "NOT_REPLAYABLE" : "REPLAYABLE",
    missingEvidence,
    hashMismatches,
    evidenceHash: evidence.evidenceHash,
  };
}
