import type { RuntimeEnvironmentValidated } from "./envSchema";

export function buildEnvironmentMetrics(environment: RuntimeEnvironmentValidated) {
  return {
    nodeEnv: environment.NODE_ENV,
    tenantMode: environment.TENANT_MODE,
    observabilityMode: environment.OBSERVABILITY_MODE,
    securityMode: environment.SECURITY_MODE,
    lockLeaseMs: environment.LOCK_LEASE_MS,
  };
}
