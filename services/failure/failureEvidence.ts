import { getFrozenStartupStatus } from "../startup/startupStatus";
import { buildRecoveryReadModel } from "../recovery/recoveryReadModel";
import { buildRecoveryTimeline } from "../recovery/recoveryTimelineBuilder";
import type { TenantContext } from "../tenancy/tenantTypes";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const recoveryAuditStore = require("../recoveryAuditStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const recoveryVerificationStore = require("../recoveryVerificationStore.js");

export type FailureSignal = {
  type?: string;
  code?: string;
  message?: string;
};

export type FailureEvidenceSources = {
  evidence?: string[];
  readModel?: any;
  timeline?: any;
  verificationState?: any;
  recoveryRequests?: any[];
  startupStatus?: { ready: boolean; checkedAt: string; summary: string } | null;
};

export type FailureEvidenceResult = {
  ok: true;
  data: {
    evidence: string[];
    contradictory: boolean;
    references: string[];
    startupStatus: FailureEvidenceSources["startupStatus"];
  };
} | {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

function contradictionDetected(evidence: string[]) {
  const normalized = evidence.map((entry) => entry.toLowerCase());
  const conflictingPairs: Array<[string, string]> = [
    ["verification:passed", "verification:failed"],
    ["timeline:matched", "timeline:disputed"],
    ["approval:granted", "approval:expired"],
  ];
  return conflictingPairs.some(([left, right]) => normalized.includes(left) && normalized.includes(right));
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value).trim()))).sort((left, right) =>
    left.localeCompare(right),
  );
}

function inferEvidenceFromSources(sources: FailureEvidenceSources) {
  const evidence = [...(sources.evidence || [])];
  const readModel = sources.readModel;
  const timeline = sources.timeline;
  const verificationState = sources.verificationState;
  const recoveryRequests = Array.isArray(sources.recoveryRequests) ? sources.recoveryRequests : [];
  const startupStatus = sources.startupStatus;

  if (readModel?.lock?.stale) {
    evidence.push("lock:stale", "lease:expired");
  }
  if (String(readModel?.verification?.status || "") === "failed") {
    evidence.push("verification:failed");
  }
  if (String(readModel?.verification?.status || "") === "passed") {
    evidence.push("verification:passed");
  }
  if (String(readModel?.execution?.status || "") === "failed") {
    evidence.push("execution:status=failed");
  }
  if (String(readModel?.execution?.status || "") === "running") {
    evidence.push("execution:status=running");
  }
  if (timeline?.meta?.matchesReadModel === false) {
    evidence.push("timeline:disputed");
  }
  if (timeline?.meta?.matchesReadModel === true) {
    evidence.push("timeline:matched");
  }
  if (String(verificationState?.latestOutcome || "").toUpperCase() === "FAILED") {
    evidence.push("verification:failed");
  }
  for (const request of recoveryRequests) {
    const policyCode = String(request?.policy?.policyCode || "");
    if (policyCode === "BLOCKED_UNSAFE_RECOVERY") {
      evidence.push("policy:denied");
    }
    if (String(request?.status || "") === "AWAITING_APPROVAL") {
      evidence.push("recovery_control:approval_required");
    }
  }
  return dedupe(evidence);
}

export async function collectFailureEvidence({
  executionId,
  tenantContext,
  signal,
  sources = {},
  nowMs,
}: {
  executionId?: string;
  tenantContext?: TenantContext;
  signal?: FailureSignal;
  sources?: FailureEvidenceSources;
  nowMs?: number;
}): Promise<FailureEvidenceResult> {
  const hasExplicitEvidence = Object.prototype.hasOwnProperty.call(sources, "evidence");
  if (hasExplicitEvidence) {
    const explicitEvidence = dedupe(Array.isArray(sources.evidence) ? sources.evidence : []);
    if (explicitEvidence.length === 0) {
      return {
        ok: false,
        error: {
          code: "FAILURE_CLASSIFICATION_EVIDENCE_MISSING",
          message: "Failure evidence is required before classification can proceed.",
        },
      };
    }

    return {
      ok: true,
      data: {
        evidence: explicitEvidence,
        contradictory: contradictionDetected(explicitEvidence),
        references: ["failure.signal"],
        startupStatus: sources.startupStatus ?? getFrozenStartupStatus(),
      },
    };
  }

  const executionEvidenceSources: FailureEvidenceSources = { ...sources };

  if (!executionEvidenceSources.readModel && executionId) {
    const readModelResult = await buildRecoveryReadModel({ executionId, tenantContext, nowMs });
    if (readModelResult.ok) {
      executionEvidenceSources.readModel = readModelResult.data;
    }
  }

  if (!executionEvidenceSources.timeline && executionId) {
    const timelineResult = await buildRecoveryTimeline({ executionId, tenantContext, nowMs });
    if (timelineResult.ok) {
      executionEvidenceSources.timeline = timelineResult.data;
    }
  }

  if (!executionEvidenceSources.recoveryRequests && executionId) {
    executionEvidenceSources.recoveryRequests = recoveryAuditStore.listRecoveryRequestsForExecution(String(executionId));
  }

  if (!executionEvidenceSources.verificationState && executionId) {
    const requestId = String(executionEvidenceSources.recoveryRequests?.[0]?.recoveryRequestId || "").trim();
    if (requestId) {
      executionEvidenceSources.verificationState = recoveryVerificationStore.deriveVerificationState({ recoveryRequestId: requestId });
    }
  }

  if (!Object.prototype.hasOwnProperty.call(executionEvidenceSources, "startupStatus")) {
    executionEvidenceSources.startupStatus = getFrozenStartupStatus();
  }

  void signal;
  const evidence = inferEvidenceFromSources(executionEvidenceSources);
  if (evidence.length === 0) {
    return {
      ok: false,
      error: {
        code: "FAILURE_CLASSIFICATION_EVIDENCE_MISSING",
        message: "Failure evidence is required before classification can proceed.",
      },
    };
  }

  return {
    ok: true,
    data: {
      evidence,
      contradictory: contradictionDetected(evidence),
      references: [
        executionEvidenceSources.readModel ? "recovery.read_model" : "",
        executionEvidenceSources.timeline ? "recovery.timeline" : "",
        executionEvidenceSources.verificationState ? "recovery.verification" : "",
        executionEvidenceSources.recoveryRequests?.length ? "recovery.audit" : "",
        executionEvidenceSources.startupStatus ? "startup.status" : "",
      ].filter(Boolean),
      startupStatus: executionEvidenceSources.startupStatus ?? null,
    },
  };
}
