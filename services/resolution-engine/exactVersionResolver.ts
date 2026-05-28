import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import type { ExecutionResolutionRequest, ResolutionFailure } from "./resolutionTypes";

export function resolveExactToolVersion(request: ExecutionResolutionRequest): {
  entry?: CanonicalToolRegistryEntry;
  failures: readonly ResolutionFailure[];
} {
  const tools = getCanonicalRegistryDocument().tools;
  const sameTool = tools.filter((candidate) => candidate.toolId === request.requestedTool);

  if (!sameTool.length) {
    return {
      failures: [{
        code: "TOOL_NOT_FOUND",
        message: "requested tool does not exist in canonical registry",
        path: "requestedTool",
      }],
    };
  }

  const exact = sameTool.filter((candidate) => candidate.version === request.requestedVersion);
  if (!exact.length) {
    return {
      failures: [{
        code: "TOOL_VERSION_MISMATCH",
        message: "requested version does not exist for the requested tool",
        path: "requestedVersion",
      }],
    };
  }

  if (exact.length > 1) {
    return {
      failures: [{
        code: "TOOL_RESOLUTION_AMBIGUOUS",
        message: "exact tool resolution is ambiguous",
      }],
    };
  }

  return {
    entry: exact[0],
    failures: [],
  };
}
