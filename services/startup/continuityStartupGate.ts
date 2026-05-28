import { validateStartupContinuity } from "./startupContinuityValidation";

export async function evaluateContinuityStartupGate(options: Parameters<typeof validateStartupContinuity>[0] = {}) {
  return validateStartupContinuity(options);
}
