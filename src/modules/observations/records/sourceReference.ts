import type { ISODateTime, UUID, Version } from "../../../core";
import type { SourceStatus, SourceType, TrustLevel } from "../../sources";

export interface SourceReference {
  source_id: UUID;
  source_name: string;
  source_type: SourceType;
  trust_level: TrustLevel;
  status: SourceStatus;
  owner_id: UUID;
  tenant_id: UUID;
  referenced_at: ISODateTime;
  version: Version;
}
