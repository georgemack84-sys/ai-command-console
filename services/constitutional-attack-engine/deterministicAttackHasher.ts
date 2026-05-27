import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function hashConstitutionalAttackValue(scope: string, value: unknown): string {
  return hashCoordinationReplayValue(`constitutional-attack:${scope}`, value);
}
