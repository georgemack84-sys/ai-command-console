import { appendImmutableLedgerEntry } from "../audit/immutableAuditLedger";
import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type {
  DeploymentContainmentDecision,
  DeploymentOverrunEvidence,
  DeploymentOverrunReplayVerification,
  DeploymentOverrunTelemetry,
  DeploymentOverrunSnapshot,
  DeploymentOverrunState,
  DeploymentFailureClassification,
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

function evidencePreimage(evidence: Omit<DeploymentOverrunEvidence, "evidenceHash">) {
  return {
    evidenceVersion: evidence.evidenceVersion,
    workflowId: evidence.workflowId,
    workflowName: evidence.workflowName,
    runId: evidence.runId,
    commitSha: evidence.commitSha,
    state: evidence.state,
    classification: evidence.classification ?? null,
    startedAt: evidence.startedAt,
    updatedAt: evidence.updatedAt,
    observedAt: evidence.observedAt,
    lastProgressAt: evidence.lastProgressAt ?? null,
    heartbeatAt: evidence.heartbeatAt ?? null,
    approvalLineage: [...evidence.approvalLineage],
    logs: [...evidence.logs],
    artifacts: [...evidence.artifacts],
    smokeResults: evidence.smokeResults ?? null,
    certification: evidence.certification ?? null,
    reasons: [...evidence.reasons],
    telemetry: evidence.telemetry,
    containment: evidence.containment,
  } as const;
}

export function hashDeploymentOverrunEvidence(evidence: Omit<DeploymentOverrunEvidence, "evidenceHash">) {
  return sha256(evidencePreimage(evidence));
}

export function buildDeploymentOverrunEvidence(input: {
  snapshot: DeploymentOverrunSnapshot;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  reasons: readonly string[];
  telemetry: DeploymentOverrunTelemetry;
  containment: DeploymentContainmentDecision;
}) {
  const evidenceBase = {
    evidenceVersion: "1.0" as const,
    workflowId: input.snapshot.workflowId,
    workflowName: input.snapshot.workflowName,
    runId: input.snapshot.runId,
    commitSha: input.snapshot.commitSha,
    state: input.state,
    classification: input.classification,
    startedAt: input.snapshot.startedAt,
    updatedAt: input.snapshot.updatedAt,
    observedAt: input.snapshot.observedAt,
    lastProgressAt: input.snapshot.lastProgressAt,
    heartbeatAt: input.snapshot.heartbeatAt,
    approvalLineage: [...input.snapshot.approvalLineage],
    logs: [...input.snapshot.logs],
    artifacts: [...input.snapshot.artifacts],
    smokeResults: input.snapshot.smokeResults,
    certification: input.snapshot.certification,
    reasons: [...input.reasons],
    telemetry: input.telemetry,
    containment: input.containment,
  };
  const evidence = deepFreeze({
    ...evidenceBase,
    evidenceHash: hashDeploymentOverrunEvidence(evidenceBase),
  });

  return {
    evidence,
    evidenceLedgerEntry: appendImmutableLedgerEntry({
      payload: evidence,
      scope: `deployment-overrun:${input.snapshot.runId}`,
    }),
  } as const;
}

export function verifyDeploymentOverrunReplayEvidence(
  evidence?: DeploymentOverrunEvidence,
): DeploymentOverrunReplayVerification {
  if (!evidence) {
    return {
      ok: false,
      status: "NOT_REPLAYABLE",
      missingEvidence: ["deployment-overrun-evidence"],
      hashMismatches: [],
      evidenceHash: "",
    };
  }

  const missingEvidence: string[] = [];
  if (!evidence.logs || evidence.logs.length === 0) missingEvidence.push("logs");
  if (!evidence.artifacts || evidence.artifacts.length === 0) missingEvidence.push("artifacts");
  if (!evidence.approvalLineage || evidence.approvalLineage.length === 0) {
    missingEvidence.push("approvalLineage");
  }
  if (!evidence.certification) missingEvidence.push("certification");

  const expectedHash = hashDeploymentOverrunEvidence({
    evidenceVersion: evidence.evidenceVersion,
    workflowId: evidence.workflowId,
    workflowName: evidence.workflowName,
    runId: evidence.runId,
    commitSha: evidence.commitSha,
    state: evidence.state,
    classification: evidence.classification,
    startedAt: evidence.startedAt,
    updatedAt: evidence.updatedAt,
    observedAt: evidence.observedAt,
    lastProgressAt: evidence.lastProgressAt,
    heartbeatAt: evidence.heartbeatAt,
    approvalLineage: evidence.approvalLineage,
    logs: evidence.logs,
    artifacts: evidence.artifacts,
    smokeResults: evidence.smokeResults,
    certification: evidence.certification,
    reasons: evidence.reasons,
    telemetry: evidence.telemetry,
    containment: evidence.containment,
  });
  const hashMismatches = expectedHash === evidence.evidenceHash ? [] : ["deployment-overrun-evidence"];

  return {
    ok: missingEvidence.length === 0 && hashMismatches.length === 0,
    status: hashMismatches.length > 0 ? "DISPUTED" : missingEvidence.length > 0 ? "NOT_REPLAYABLE" : "REPLAYABLE",
    missingEvidence,
    hashMismatches,
    evidenceHash: evidence.evidenceHash || "",
  };
}
