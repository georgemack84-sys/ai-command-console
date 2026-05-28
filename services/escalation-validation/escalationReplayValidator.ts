import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { EscalationAwareCoordinationError } from "@/types/escalation-aware-coordination";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";

function error(
  code: EscalationAwareCoordinationError["code"],
  message: string,
  path?: string,
): EscalationAwareCoordinationError {
  return Object.freeze({ code, message, path });
}

export function validateEscalationReplay(input: {
  coordinationReplay: CoordinationReplayResult;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly EscalationAwareCoordinationError[] {
  const errors: EscalationAwareCoordinationError[] = [];
  const determinism = assessReplayDeterminism({
    ledgerEvents: input.coordinationReplay.ledger.entries.map((entry, index) => ({
      sequence: index,
      ...entry,
    })),
    continuitySnapshots: [input.coordinationReplay.governance, input.coordinationReplay.orchestration],
    auditEvents: [input.coordinationReplay.audit],
  });
  if (!determinism.deterministic) {
    errors.push(error(
      "ESCALATION_COORDINATION_REPLAY_DRIFT",
      "Replay determinism degraded and escalation replay cannot relax oversight.",
      "coordinationReplay",
    ));
  }
  if (input.coordinationReplay.state === "fail_closed") {
    errors.push(error(
      "ESCALATION_COORDINATION_REPLAY_AMBIGUITY",
      "Replay ambiguity requires escalation freeze.",
      "coordinationReplay.state",
    ));
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("repairreplay") || serialized.includes("replaymutation")) {
    errors.push(error(
      "ESCALATION_COORDINATION_SYNTHETIC_CONTINUITY",
      "Replay mutation or repair markers were detected.",
      "metadata.replay",
    ));
  }
  return Object.freeze(errors);
}
