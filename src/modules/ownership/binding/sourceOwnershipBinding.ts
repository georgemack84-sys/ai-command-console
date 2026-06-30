import { EdgeBookError } from "../../../core";
import type { SourceRegistryStore } from "../../sources";
import { assertSourceAllowedForObservation } from "../../sources";
import type { OwnershipContract } from "../contracts/ownershipContract";

export function bindOwnershipToSource(
  store: SourceRegistryStore,
  ownership: OwnershipContract,
): { status: "BOUND"; ownership: OwnershipContract } {
  const sourceResult = assertSourceAllowedForObservation(store, ownership.source_id);
  const source = sourceResult.source;

  if (source.owner_id !== ownership.owner_id) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Source owner_id does not match ownership owner_id.", "owner_id");
  }

  if (source.tenant_id !== ownership.tenant_id) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Source tenant_id does not match ownership tenant_id.", "tenant_id");
  }

  return { status: "BOUND", ownership: { ...ownership } };
}
