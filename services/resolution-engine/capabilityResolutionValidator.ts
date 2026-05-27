import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { ExecutionResolutionRequest, ResolutionFailure } from "./resolutionTypes";

export function validateCapabilityResolution(
  request: ExecutionResolutionRequest,
  entry: CanonicalToolRegistryEntry,
): readonly ResolutionFailure[] {
  const failures: ResolutionFailure[] = [];

  if (entry.executionMode !== request.executionMode) {
    failures.push({
      code: "RESOLUTION_REJECTED",
      message: "requested execution mode does not match published tool execution mode",
      path: "executionMode",
    });
  }

  for (const capability of request.requiredCapabilities) {
    if (!entry.runtimeCapabilities.includes(capability)) {
      failures.push({
        code: "TOOL_CAPABILITY_AUTHORITY_INVALID",
        message: "requested capability is not declared by the resolved tool version",
        path: "requiredCapabilities",
      });
    }
  }

  return failures;
}
