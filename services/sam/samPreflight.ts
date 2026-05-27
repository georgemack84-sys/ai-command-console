import { loadSamEvidenceState, loadSamOperatorActionState, loadSamReadModelState, loadSamTimelineState } from "./adapters";
import { SAM_ERROR_CODES } from "./samErrors";
import type { SamProposal, SamPreflightResult } from "./samTypes";

function block(
  reason: string,
  checks: SamPreflightResult["checks"],
  source: SamPreflightResult["source"],
): SamPreflightResult {
  return {
    allowed: false,
    blocked: true,
    reason,
    checks,
    source,
  };
}

export async function runSamPreflight({
  db,
  proposal,
  nowMs,
}: {
  db?: unknown;
  proposal: SamProposal;
  nowMs?: number;
}): Promise<SamPreflightResult> {
  try {
    if (proposal.actionType === "unknown") {
      return block(
        SAM_ERROR_CODES.SAM_ACTION_UNKNOWN,
        {
          readModelAvailable: false,
          operatorActionAllowed: false,
          evidenceValid: false,
          timelineConsistent: false,
          lockValid: false,
          disputedState: true,
        },
        {},
      );
    }

    if (proposal.params?.realExecution === true) {
      return block(
        SAM_ERROR_CODES.SAM_REAL_EXECUTION_FORBIDDEN,
        {
          readModelAvailable: false,
          operatorActionAllowed: false,
          evidenceValid: false,
          timelineConsistent: false,
          lockValid: false,
          disputedState: true,
        },
        {},
      );
    }

    const [readModelState, timelineState, operatorState, evidenceState] = await Promise.all([
      loadSamReadModelState({ db, executionId: proposal.executionId, nowMs }),
      loadSamTimelineState({ db, executionId: proposal.executionId, nowMs }),
      loadSamOperatorActionState({ db, executionId: proposal.executionId, actionType: proposal.actionType, nowMs }),
      loadSamEvidenceState({ db, executionId: proposal.executionId, nowMs }),
    ]);

    const checks = {
      readModelAvailable: readModelState.readModelAvailable === true,
      operatorActionAllowed: operatorState.operatorActionAllowed === true,
      evidenceValid: evidenceState.evidenceValid === true,
      timelineConsistent: timelineState.timelineConsistent === true,
      lockValid: readModelState.readModel?.lock?.stale !== true,
      disputedState:
        evidenceState.disputedState === true
        || timelineState.disputedState === true
        || operatorState.operatorView?.timelineMatchesReadModel === false,
    } satisfies SamPreflightResult["checks"];

    const source = {
      readModel: String(readModelState.source || ""),
      operatorView: String(operatorState.source || ""),
      evidence: String(evidenceState.source || ""),
      timeline: String(timelineState.source || ""),
    } satisfies SamPreflightResult["source"];

    if (!checks.readModelAvailable) {
      return block(readModelState.reason || SAM_ERROR_CODES.SAM_READ_MODEL_UNAVAILABLE, checks, source);
    }
    if (!checks.evidenceValid) {
      return block(evidenceState.reason || SAM_ERROR_CODES.SAM_EVIDENCE_INVALID, checks, source);
    }
    if (checks.disputedState || !checks.timelineConsistent) {
      return block(timelineState.reason || SAM_ERROR_CODES.SAM_TIMELINE_DISPUTED, checks, source);
    }
    if (!checks.operatorActionAllowed) {
      return block(operatorState.reason || SAM_ERROR_CODES.SAM_OPERATOR_ACTION_BLOCKED, checks, source);
    }
    if (!checks.lockValid) {
      return block(SAM_ERROR_CODES.SAM_LOCK_INVALID, checks, source);
    }

    return {
      allowed: true,
      blocked: false,
      checks,
      source,
    };
  } catch {
    return {
      allowed: false,
      blocked: true,
      reason: SAM_ERROR_CODES.SAM_ADAPTER_FAILED,
      checks: {
        readModelAvailable: false,
        operatorActionAllowed: false,
        evidenceValid: false,
        timelineConsistent: false,
        lockValid: false,
        disputedState: true,
      },
      source: {},
    };
  }
}
