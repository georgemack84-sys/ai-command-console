import type { ISODateTime, UUID, Version } from "../../../core";

export type VerificationStatus = "VERIFIED" | "BLOCKED" | "FAILED";

export type VerificationStage =
  | "SOURCE_VALIDATION"
  | "SCHEMA_VALIDATION"
  | "OWNERSHIP_VALIDATION"
  | "TIMESTAMP_VALIDATION"
  | "REQUIRED_FIELD_VALIDATION"
  | "DUPLICATE_CONTROL"
  | "STORE_AUTHORIZATION";

export interface VerificationResult {
  verification_id: UUID;
  observation_id: UUID;
  market_id: UUID;
  source_id: UUID;
  ownership_hash: string;
  status: VerificationStatus;
  failure_reason?: string;
  failed_stage?: VerificationStage;
  timestamp: ISODateTime;
  version: Version;
}

export interface StageVerificationResult {
  status: "PASSED" | "FAILED";
  failed_stage?: VerificationStage;
  failure_reason?: string;
}
