import { EdgeBookError } from "../../../core";
import { createSourceOwnership, validateSourceOwnership } from "../ownership/sourceOwnership";
import type { SourceRegistryObject } from "../schemas/sourceRegistryTypes";
import type { SourceRegistryStore } from "../registry/sourceRegistryStore";

export function assertSourceRegistered(store: SourceRegistryStore, sourceId: string): SourceRegistryObject {
  const source = store.getSourceById(sourceId);
  if (!source) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Unknown source is blocked from observation.", "source_id");
  }

  return source;
}

export function assertSourceActive(source: SourceRegistryObject): SourceRegistryObject {
  if (source.status === "DISABLED") {
    throw new EdgeBookError("DISABLED_FEATURE", "Disabled source is blocked from observation.", "status");
  }

  if (source.status === "BLOCKED") {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Blocked source is blocked from observation.", "status");
  }

  if (source.status === "PENDING") {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Pending source is restricted from observation.", "status");
  }

  return source;
}

export function assertSourceOwned(source: SourceRegistryObject): SourceRegistryObject {
  if (!source.owner_id || !source.tenant_id) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Source ownership is mandatory.", "owner_id");
  }

  if (source.owner_id.trim().toLowerCase() === "anonymous" || source.source_name.trim().toLowerCase() === "anonymous") {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Anonymous source is blocked from observation.", "owner_id");
  }

  const ownership = createSourceOwnership(source);
  const ownershipResult = validateSourceOwnership(ownership);
  if (ownershipResult.status === "REJECTED") {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", ownershipResult.reasons.join("; "), "ownership_hash");
  }

  return source;
}

export function assertSourceAllowedForObservation(
  store: SourceRegistryStore,
  sourceId: string,
): { status: "ALLOWED"; source: SourceRegistryObject } {
  const source = assertSourceOwned(assertSourceActive(assertSourceRegistered(store, sourceId)));

  return { status: "ALLOWED", source };
}
