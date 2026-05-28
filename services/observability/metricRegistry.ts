import type { ObservabilityMetricName, ObservabilityMetricUnit } from "./metricTypes";

const registry = new Map<ObservabilityMetricName, { unit: ObservabilityMetricUnit; component: string }>([
  ["failedRecoveries", { unit: "count", component: "recovery" }],
  ["lockContentionRate", { unit: "ratio", component: "locks" }],
  ["verificationMismatches", { unit: "count", component: "verification" }],
  ["systemHealthStatus", { unit: "status", component: "telemetry" }],
  ["contractValidationFailures", { unit: "count", component: "contracts" }],
  ["contractCompatibilityFailures", { unit: "count", component: "contracts" }],
  ["replayValidationFailures", { unit: "count", component: "contracts" }],
  ["readinessGateFailures", { unit: "count", component: "contracts" }],
  ["degradedContractResponses", { unit: "count", component: "apiV1" }],
  ["apiV1ValidationFailures", { unit: "count", component: "apiV1" }],
  ["strictModeRejections", { unit: "count", component: "contracts" }],
  ["unknownFieldRejections", { unit: "count", component: "contracts" }],
  ["governancePolicyFailures", { unit: "count", component: "contracts" }],
  ["schemaStabilityViolations", { unit: "count", component: "contracts" }],
  ["apiV1OutboundValidationFailures", { unit: "count", component: "apiV1" }],
  ["responseStabilityFailures", { unit: "count", component: "apiV1" }],
  ["samQueueDepth", { unit: "count", component: "sam" }],
  ["samRetryCount", { unit: "count", component: "sam" }],
  ["samDryRunGenerated", { unit: "count", component: "sam" }],
  ["samBridgeBlocked", { unit: "count", component: "sam" }],
  ["samBackpressureActivations", { unit: "count", component: "sam" }],
  ["degradedModeActivations", { unit: "count", component: "sam" }],
]);

export function getMetricDefinition(name: ObservabilityMetricName) {
  return registry.get(name);
}
