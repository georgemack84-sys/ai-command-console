import type { RuntimeCapability } from "@/schemas/toolRegistrySchema";

export type ExecutionTrustZone =
  | "isolated"
  | "controlled"
  | "approved"
  | "privileged"
  | "internal"
  | "forbidden";

export type EnforcementReasonCode =
  | "EXECUTION_POLICY_NOT_FOUND"
  | "EXECUTION_TRUST_RESOLUTION_FAILED"
  | "EXECUTION_TRUST_ZONE_VIOLATION"
  | "EXECUTION_SANDBOX_DERIVATION_FAILED"
  | "EXECUTION_BOUNDARY_DERIVATION_FAILED"
  | "EXECUTION_REPLAY_REQUIRED"
  | "EXECUTION_REPLAY_CONTAINMENT_MISMATCH"
  | "EXECUTION_ROLLBACK_REQUIRED"
  | "EXECUTION_TENANT_ISOLATION_VIOLATION"
  | "EXECUTION_PROVENANCE_INVALID"
  | "RUNTIME_AUTHORITY_DRIFT_DETECTED"
  | "RUNTIME_AUTHORITY_LOCK_INVALID"
  | "FILESYSTEM_ISOLATION_VIOLATION"
  | "NETWORK_ISOLATION_VIOLATION"
  | "PROCESS_ISOLATION_VIOLATION"
  | "PRIVILEGE_ESCALATION_ATTEMPT"
  | "TOOL_CAPABILITY_VIOLATION";

export type EnforcementViolation = Readonly<{
  rule: string;
  expected?: unknown;
  actual?: unknown;
  reasonCode: EnforcementReasonCode;
}>;

export type RuntimeBoundaryEnvelope = Readonly<{
  filesystem: Readonly<{
    isolated: boolean;
    allowedScopes: readonly string[];
    rollbackRequired: boolean;
  }>;
  network: Readonly<{
    isolated: boolean;
    allowedDomains: readonly string[];
    allowPrivateNetworks: boolean;
    allowLocalhost: boolean;
  }>;
  process: Readonly<{
    isolated: boolean;
    allowedCommands: readonly string[];
    shellAccess: boolean;
  }>;
  tenant: Readonly<{
    isolated: boolean;
    tenantId?: string | null;
  }>;
  privilege: Readonly<{
    privilegedMonitoringRequired: boolean;
    constitutionalApprovalRequired: boolean;
    internalOnly: boolean;
  }>;
}>;

export type DerivedSandboxProfile = Readonly<{
  profileId: string;
  filesystemIsolation: boolean;
  networkIsolation: boolean;
  processIsolation: boolean;
  privilegedMonitoring: boolean;
  replayRequired: boolean;
  rollbackRequired: boolean;
  internalOnly: boolean;
}>;

export type RuntimeAuthorityEnvelope = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  runtimeCapabilities: RuntimeCapability[];
  trustZone: ExecutionTrustZone;
  sandboxProfile: string;
  derivedPolicyHash: string;
  derivedBoundaryHash: string;
  sandboxProfileHash: string;
  environmentHash?: string;
}>;

export type ExecutionEnforcementDecision = Readonly<{
  allowed: boolean;
  decision: "ALLOW" | "DENY" | "ESCALATE" | "SIMULATION_ONLY";
  reasonCode?: EnforcementReasonCode;
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  trustZone?: ExecutionTrustZone;
  sandboxProfile?: string;
  violations: EnforcementViolation[];
  evidenceHash: string;
}>;

export type RuntimeAuthorityLock = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  trustZone: ExecutionTrustZone;
  sandboxProfileHash: string;
  derivedBoundaryHash: string;
  lockedAt: string;
  lockHash: string;
}>;

export type ReplayContainmentBinding = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  sandboxProfileHash: string;
  trustBoundaryHash: string;
  environmentHash?: string;
}>;

export type UnifiedEnforcementInput = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  requestedCapability: RuntimeCapability;
  requestedScope?: string;
  trustZoneHint?: string;
  tenantContext?: Readonly<{
    tenantId?: string;
    expectedTenantId?: string;
  }>;
  replayBinding?: ReplayContainmentBinding;
  runtimeMetadata?: Readonly<{
    environmentHash?: string;
    currentTrustZone?: string;
    sandboxProfileHash?: string;
    derivedBoundaryHash?: string;
    mutationAttempted?: boolean;
    filesystemIsolationReady?: boolean;
    networkIsolationReady?: boolean;
    processIsolationReady?: boolean;
    privilegedMonitoringReady?: boolean;
  }>;
  governanceMetadata?: Readonly<{
    approvalsSatisfied?: boolean;
    constitutionalApproval?: boolean;
    governanceApproved?: boolean;
    simulationOnly?: boolean;
    internalRuntime?: boolean;
    replayAvailable?: boolean;
    rollbackPrepared?: boolean;
  }>;
  lockTimestamp: string;
  existingAuthorityLock?: RuntimeAuthorityLock;
}>;

export type EnforcementAuditRecord = Readonly<{
  eventType: "execution.enforcement.decision";
  toolId: string;
  toolVersion: string;
  decision: ExecutionEnforcementDecision["decision"];
  reasonCode?: EnforcementReasonCode;
  evidenceHash: string;
  violationCodes: readonly EnforcementReasonCode[];
  eventHash: string;
}>;
