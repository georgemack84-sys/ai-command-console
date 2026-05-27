import { reconstructReplayHistory } from "./replayReconstructionEngine";
import { detectReplayDivergence } from "./divergence/replayDivergenceDetector";
import { computeReplayConfidence } from "./replayConfidenceEngine";
import { appendReplayAuditEvent } from "./replayAudit";
import { recordReplayTelemetry } from "../observability/replayTelemetry";
import type { ReplayConfidence, ReplayDivergence, ReplayReconstructionResult } from "../contracts/replay/replayTypes";
import type { TenantContext } from "../tenancy/tenantTypes";

export function verifyReplay({
  executionId,
  tenantContext,
  ledgerEvents = [],
  historicalState = null,
  auditEvents = [],
  continuitySnapshots = [],
}: {
  executionId: string;
  tenantContext?: TenantContext;
  ledgerEvents?: Record<string, unknown>[];
  historicalState?: Record<string, unknown> | null;
  auditEvents?: Record<string, unknown>[];
  continuitySnapshots?: Record<string, unknown>[];
}):
  | {
      ok: true;
      data: {
        executionId: string;
        verified: boolean;
        deterministic: boolean;
        reconstruction: ReplayReconstructionResult;
        divergences: ReplayDivergence[];
        confidence: ReplayConfidence;
      };
    }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } } {
  appendReplayAuditEvent({
    type: "replay.started",
    executionId,
    tenantId: tenantContext?.tenantId || null,
    workspaceId: tenantContext?.workspaceId || null,
  });

  const reconstruction = reconstructReplayHistory({
    executionId,
    ledgerEvents,
    auditEvents,
    continuitySnapshots,
  });

  if (reconstruction.missingEvidence.length > 0) {
    appendReplayAuditEvent({
      type: "replay.blocked",
      executionId,
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      payload: {
        reason: "REPLAY_EVIDENCE_INCOMPLETE",
        missingEvidence: reconstruction.missingEvidence,
      },
    });
    recordReplayTelemetry({
      tenantContext,
      metric: "replay_non_deterministic_total",
    });
    return {
      ok: false,
      error: {
        code: "REPLAY_EVIDENCE_INCOMPLETE",
        message: "Replay evidence is incomplete.",
        details: {
          reconstruction,
        },
      },
    };
  }

  const replayState = {
    runtimeState: reconstruction.reconstructedStates.at(-1) || "",
    outputHash: String((ledgerEvents.at(-1)?.eventPayload as Record<string, unknown> | undefined)?.outputHash || ""),
  };
  const historicalSequence = Array.isArray(historicalState?.historicalSequence)
    ? (historicalState?.historicalSequence as string[])
    : reconstruction.replaySequence;
  const divergences = detectReplayDivergence({
    replayState,
    historicalState,
    replaySequence: reconstruction.replaySequence,
    historicalSequence,
    governanceApproved: auditEvents.some((event) => String(event.type || "").includes("APPROVED")),
    expectedGovernanceApproved: auditEvents.some((event) => String(event.type || "").includes("APPROVED")),
  });
  const confidence = computeReplayConfidence({
    deterministic: reconstruction.deterministic,
    missingEvidence: reconstruction.missingEvidence,
    divergences,
    continuityRiskScore: Number((continuitySnapshots.at(-1) as Record<string, unknown> | undefined)?.continuityRiskScore || 0),
    staleLeaseDetected: ledgerEvents.some((event) => String(event.eventType || "").includes("lease") && String((event.eventPayload as Record<string, unknown> | undefined)?.state || "").includes("stale")),
    verifiedEvidence: reconstruction.replaySequence,
  });

  if (!reconstruction.deterministic) {
    appendReplayAuditEvent({
      type: "replay.non_deterministic",
      executionId,
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      payload: {
        warnings: reconstruction.warnings,
      },
    });
    recordReplayTelemetry({
      tenantContext,
      metric: "replay_non_deterministic_total",
      confidenceScore: confidence.score,
    });
  }

  if (divergences.length > 0) {
    appendReplayAuditEvent({
      type: "replay.diverged",
      executionId,
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      payload: {
        divergences,
      },
    });
    recordReplayTelemetry({
      tenantContext,
      metric: "replay_divergence_total",
      confidenceScore: confidence.score,
    });
  } else {
    appendReplayAuditEvent({
      type: "replay.verified",
      executionId,
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      payload: {
        confidenceScore: confidence.score,
      },
    });
    recordReplayTelemetry({
      tenantContext,
      metric: "replay_verification_success_total",
      confidenceScore: confidence.score,
    });
  }

  appendReplayAuditEvent({
    type: "replay.completed",
    executionId,
    tenantId: tenantContext?.tenantId || null,
    workspaceId: tenantContext?.workspaceId || null,
    payload: {
      deterministic: reconstruction.deterministic,
      divergenceCount: divergences.length,
    },
  });

  return {
    ok: true,
    data: {
      executionId,
      verified: reconstruction.deterministic && divergences.length === 0,
      deterministic: reconstruction.deterministic,
      reconstruction,
      divergences,
      confidence,
    },
  };
}
