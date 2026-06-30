import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../../core";
import type { SourceOwnership, SourceRegistryObject } from "../schemas/sourceRegistryTypes";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(",")}}`;
}

export function createSourceOwnershipHash(input: Omit<SourceOwnership, "ownership_hash">): string {
  const serialized = stableStringify(input);
  let hash = 0x811c9dc5;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `srcown_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createSourceOwnership(source: SourceRegistryObject): SourceOwnership {
  const ownership = {
    source_id: source.source_id,
    owner_id: source.owner_id,
    tenant_id: source.tenant_id,
    created_at: source.created_at,
    version: source.version,
  };

  return {
    ...ownership,
    ownership_hash: createSourceOwnershipHash(ownership),
  };
}

export function validateSourceOwnership(ownership: Partial<SourceOwnership>): { status: "VALID" | "REJECTED"; reasons: string[] } {
  const reasons: string[] = [];

  if (!isNonEmptyString(ownership.source_id)) reasons.push("source_id is required for ownership");
  if (!isNonEmptyString(ownership.owner_id)) reasons.push("owner_id is required");
  if (!isNonEmptyString(ownership.tenant_id)) reasons.push("tenant_id is required");
  if (!isNonEmptyString(ownership.ownership_hash)) reasons.push("ownership_hash is required");
  if (!isValidTimestamp(ownership.created_at)) reasons.push("created_at must be a valid timestamp");
  if (!isValidVersion(ownership.version)) reasons.push("version is required and must be valid");

  if (isNonEmptyString(ownership.owner_id) && ownership.owner_id.trim().toLowerCase() === "anonymous") {
    reasons.push("anonymous sources are invalid");
  }

  const sourceId = ownership.source_id;
  const ownerId = ownership.owner_id;
  const tenantId = ownership.tenant_id;
  const createdAt = ownership.created_at;
  const version = ownership.version;

  if (
    reasons.length === 0 &&
    isNonEmptyString(sourceId) &&
    isNonEmptyString(ownerId) &&
    isNonEmptyString(tenantId) &&
    isValidTimestamp(createdAt) &&
    isValidVersion(version)
  ) {
    const expectedHash = createSourceOwnershipHash({
      source_id: sourceId,
      owner_id: ownerId,
      tenant_id: tenantId,
      created_at: createdAt,
      version,
    });

    if (ownership.ownership_hash !== expectedHash) {
      reasons.push("ownership_hash must be deterministic");
    }
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}
