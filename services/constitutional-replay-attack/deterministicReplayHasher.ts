import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function hashConstitutionalReplayValue(scope: string, value: unknown): string {
  return hashCoordinationReplayValue(`constitutional-replay-attack:${scope}`, value);
}
