import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function hashOverrideAuditValue(scope: string, value: unknown): string {
  return hashOverrideReplayValue(`operator-authority-audit:${scope}`, value);
}
