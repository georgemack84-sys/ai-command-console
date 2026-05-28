import { abortStartup } from "./startupAbort";

export function assertStartupAllowed<T extends { ok: boolean; error?: { code: string; message: string; details?: Record<string, unknown> } }>(result: T) {
  if (!result.ok) {
    throw abortStartup(result.error?.code || "STARTUP_ABORTED", result.error?.message || "Startup aborted.", result.error?.details);
  }
  return result;
}
