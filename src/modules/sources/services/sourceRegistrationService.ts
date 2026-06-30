import { createSourceOwnership } from "../ownership/sourceOwnership";
import type { SourceRegistryStore } from "../registry/sourceRegistryStore";
import type { SourceRegistryObject, SourceRegistrationResult } from "../schemas/sourceRegistryTypes";

export function registerSourceWithOwnership(
  store: SourceRegistryStore,
  source: SourceRegistryObject,
): SourceRegistrationResult & { ownership_hash?: string } {
  const result = store.registerSource(source);

  if (result.status === "REJECTED") {
    return result;
  }

  return {
    ...result,
    ownership_hash: createSourceOwnership(source).ownership_hash,
  };
}
