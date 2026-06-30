import type { ISODateTime, UUID, Version } from "../../../core";
import type { VerificationStage } from "./verificationResult";

export interface VerificationFailureRecord {
  failure_id: UUID;
  observation_id: UUID;
  source_id: UUID;
  market_id: UUID;
  failed_stage: VerificationStage;
  failure_reason: string;
  raw_payload_reference: string;
  timestamp: ISODateTime;
  version: Version;
}
