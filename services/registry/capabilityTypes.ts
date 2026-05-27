import type {
  CanonicalToolRegistryEntry,
  RegistryErrorCode,
  RuntimeCapability,
} from "@/schemas/toolRegistrySchema";

export type CapabilityContractValidationResult = {
  valid: boolean;
  reasons: RegistryErrorCode[];
};

export type CapabilityScopeRequest = string | null;

export type CapabilityAssertionInput = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  requestedCapability: RuntimeCapability;
  requestedScope?: CapabilityScopeRequest;
  trustZone?: string | null;
}>;

export type CapabilityAssertionResult = Readonly<{
  allowed: boolean;
  code?: RegistryErrorCode;
  reason?: string;
  entry?: CanonicalToolRegistryEntry;
}>;

export type CapabilityAuditEvent = Readonly<{
  event: "capability.invoked" | "capability.violation";
  toolId: string;
  toolVersion: string;
  capability?: RuntimeCapability;
  attemptedCapability?: RuntimeCapability;
  declaredCapabilities: readonly RuntimeCapability[];
  scope: string | null;
  capabilityHash: string;
  registryHash: string;
  result: "allowed" | "blocked";
  reason?: RegistryErrorCode;
  eventHash: string;
}>;
