import type { ReplayBindingFailure, ReplayBindingFailureCode } from "./replay-binding-types";

export function createReplayBindingFailure(
  code: ReplayBindingFailureCode,
  message: string,
  path?: string,
): ReplayBindingFailure {
  return {
    code,
    message,
    path,
  };
}
