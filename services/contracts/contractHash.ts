import type { ContractDefinitionInput } from "./contractTypes";
import { inspectSchema } from "./schemaCompiler";
import { hashPayloadDeterministically } from "./payloadHasher";

export function computeContractHash(definition: ContractDefinitionInput) {
  return hashPayloadDeterministically({
    id: definition.id,
    version: definition.version,
    kind: definition.kind,
    owner: definition.owner,
    schema: inspectSchema(definition.schema),
    governance: definition.governance,
    deprecated: definition.deprecated || false,
    deprecatedSince: definition.deprecatedSince,
    sunsetAt: definition.sunsetAt,
    migrationTargetVersion: definition.migrationTargetVersion,
    metadata: definition.metadata || {},
  });
}
