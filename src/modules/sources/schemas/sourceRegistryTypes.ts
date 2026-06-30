import type { EventSeverity, ISODateTime, UUID, Version } from "../../../core";

export type SourceType = "SPORTSBOOK" | "API" | "MANUAL_INPUT";
export type TrustLevel = "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";
export type SourceStatus = "ACTIVE" | "DISABLED" | "PENDING" | "BLOCKED";

export interface SourceRegistryObject {
  source_id: UUID;
  source_name: string;
  source_type: SourceType;
  trust_level: TrustLevel;
  status: SourceStatus;
  owner_id: UUID;
  tenant_id: UUID;
  created_at: ISODateTime;
  version: Version;
}

export interface SourceOwnership {
  source_id: UUID;
  owner_id: UUID;
  tenant_id: UUID;
  ownership_hash: string;
  created_at: ISODateTime;
  version: Version;
}

export type SourceRegistryEventType =
  | "SOURCE_REGISTERED"
  | "SOURCE_BLOCKED"
  | "SOURCE_DISABLED"
  | "SOURCE_REJECTED"
  | "OWNERSHIP_VALIDATED"
  | "OWNERSHIP_FAILED"
  | "DUPLICATE_SOURCE_REJECTED";

export interface SourceRegistryEvent {
  event_id: UUID;
  source_id: UUID;
  event_type: SourceRegistryEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
}

export type SourceValidationStatus = "VALID" | "REJECTED";

export interface SourceValidationResult {
  status: SourceValidationStatus;
  reasons: string[];
}

export interface SourceRegistrationResult {
  status: "REGISTERED" | "REJECTED";
  source?: SourceRegistryObject;
  events: SourceRegistryEvent[];
  reasons: string[];
}
