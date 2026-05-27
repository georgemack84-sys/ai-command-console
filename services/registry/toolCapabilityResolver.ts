import { getToolRegistry } from "./toolRegistry";

export function resolveToolCapability(capability: string) {
  const entry = getToolRegistry().find((tool) => tool.capabilities.includes(capability));
  return {
    entry: entry ?? null,
    capabilityMatch: Boolean(entry),
  };
}
