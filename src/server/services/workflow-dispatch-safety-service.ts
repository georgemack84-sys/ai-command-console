import { getWorkflowSandboxDispatchSafety } from "@/src/server/services/workflow-sandbox-verification-service";

/**
 * A single source of truth for the UI and future dispatch adapters. This
 * service reports the fail-closed policy state, including durable verification
 * and owner approval when the target is the built-in local sandbox.
 */
export async function getWorkflowDispatchSafety(workspaceId: string) {
  return getWorkflowSandboxDispatchSafety(workspaceId);
}
