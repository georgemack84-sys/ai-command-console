import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function hashGovernanceDriftValue(scope: string, value: unknown): string {
  return hashCoordinationReplayValue(`governance-drift:${scope}`, value);
}
