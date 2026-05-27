import type { CanonicalIntent } from "@/types/semanticResolution";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";

function isExternalTarget(target: string) {
  return (
    /^https?:\/\//i.test(target)
    || (
      /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(target)
      && !/^localhost$/i.test(target)
      && !isFilesystemPath(target)
    )
  );
}

function isFilesystemPath(target: string) {
  return /[\\/]/.test(target) || /\.[A-Za-z0-9]+$/.test(target);
}

export function validateIntentTargetBoundary(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  const target = input.canonicalIntent.target;
  const registryEntry = input.registryEntry;
  const externalTarget = isExternalTarget(target);
  const normalizedTarget = input.canonicalIntent.target.split(":")[0] ?? target;
  const allowedByFilesystemPattern =
    Boolean(registryEntry?.allowedTargets.includes("filesystem"))
    && isFilesystemPath(target);
  const allowedByGenericPattern =
    Boolean(registryEntry?.allowedTargets.includes(normalizedTarget))
    || Boolean(registryEntry?.allowedTargets.includes(target));

  const blockedReasons = [
    ...(registryEntry && registryEntry.allowedTargets.length > 0 && !allowedByFilesystemPattern && !allowedByGenericPattern ? ["INVALID_TARGET"] : []),
    ...(registryEntry?.deniedTargets.includes(target) ? ["INVALID_TARGET"] : []),
    ...(externalTarget && registryEntry?.parameterConstraints.allowExternalHosts === false ? ["EXTERNAL_TARGET_BLOCKED"] : []),
  ];

  return {
    valid: blockedReasons.length === 0,
    blockedReasons,
  };
}
