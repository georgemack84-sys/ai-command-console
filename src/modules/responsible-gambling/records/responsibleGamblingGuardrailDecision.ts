import type { ISODateTime, UUID, Version } from "../../../core";

export type GamblingOutputStatus =
  | "ALLOWED_INFORMATIONAL"
  | "BLOCKED_PICK"
  | "BLOCKED_GUARANTEE"
  | "BLOCKED_AUTOMATION"
  | "BLOCKED_CHASING_LOSSES"
  | "BLOCKED_MISLEADING_CONFIDENCE"
  | "BLOCKED_PREMATURE_RECOMMENDATION";

export interface ResponsibleGamblingGuardrailDecision {
  decision_id: UUID;
  requested_output: string;
  status: GamblingOutputStatus;
  allowed_output?: string;
  blocked_reason?: string;
  disclaimer_applied: boolean;
  timestamp: ISODateTime;
  version: Version;
}
