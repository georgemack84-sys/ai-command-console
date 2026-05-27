import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { DerivedSandboxProfile } from "./enforcementTypes";

export function deriveSandboxProfile(entry: CanonicalToolRegistryEntry): DerivedSandboxProfile {
  const caps = new Set(entry.runtimeCapabilities);
  const internalOnly = caps.has("governance");
  const rollbackRequired = caps.has("write") || caps.has("execute") || caps.has("recovery");

  const parts = [
    caps.has("write") ? "fs" : "nofs",
    caps.has("network") ? "net" : "nonet",
    caps.has("execute") ? "proc" : "noproc",
    caps.has("privileged") ? "priv" : "nopriv",
    internalOnly ? "internal" : "external-denied",
    rollbackRequired ? "rollback" : "norollback",
  ];

  return {
    profileId: parts.join(":"),
    filesystemIsolation: caps.has("write"),
    networkIsolation: caps.has("network"),
    processIsolation: caps.has("execute") || caps.has("privileged"),
    privilegedMonitoring: caps.has("privileged"),
    replayRequired: entry.supportsReplay,
    rollbackRequired,
    internalOnly,
  };
}
