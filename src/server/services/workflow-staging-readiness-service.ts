import { getWorkflowStagingReadiness } from "@/src/config/env";

/** A read-only preflight for future independently deployed staging adapters. */
export function getWorkflowStagingIntegrationReadiness() {
  return getWorkflowStagingReadiness();
}
