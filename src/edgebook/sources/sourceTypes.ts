export type SourceType = "sportsbook" | "api" | "feed" | "manual_input" | "internal";

export type SourceTrustLevel = "LOW" | "MEDIUM" | "HIGH" | "VERIFIED";

export type SourceStatus = "enabled" | "disabled" | "limited";

export interface SourceRegistryEntry {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  trust_level: SourceTrustLevel;
  owner_id: string;
  tenant_id: string;
  status: SourceStatus;
  version: string;
  created_at: string;
  updated_at: string;
}

export type SourceValidationCode =
  | "SOURCE_VALID"
  | "SOURCE_UNKNOWN"
  | "SOURCE_DISABLED"
  | "SOURCE_ANONYMOUS"
  | "SOURCE_MISSING_OWNERSHIP";

export interface SourceValidationResult {
  status: "VALID" | "INVALID" | "LIMITED" | "REJECTED";
  code: SourceValidationCode;
  source?: SourceRegistryEntry;
  reason: string;
}
