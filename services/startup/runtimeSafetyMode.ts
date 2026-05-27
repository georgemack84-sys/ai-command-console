export function determineRuntimeSafetyMode(environment: { NODE_ENV: string; FAIL_FAST_ENABLED: boolean }) {
  if (environment.NODE_ENV === "production") {
    return "strict";
  }
  return environment.FAIL_FAST_ENABLED ? "strict" : "relaxed";
}
