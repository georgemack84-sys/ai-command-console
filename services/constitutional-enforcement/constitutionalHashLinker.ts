import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";

export function hashConstitutionalValue(scope: string, value: unknown): string {
  return hashReplayValue(scope, value);
}
