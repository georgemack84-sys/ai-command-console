export type MonitoringTriggerErrorCode =
  | "TRIGGER_TYPE_INVALID"
  | "TRIGGER_REPLAY_MISMATCH"
  | "TRIGGER_GOVERNANCE_MISSING"
  | "TRIGGER_OVERRIDE_MISSING"
  | "TRIGGER_CONFIDENCE_INVALID"
  | "TRIGGER_ESCALATION_AMBIGUOUS"
  | "TRIGGER_CORRELATION_INVALID"
  | "TRIGGER_LINEAGE_INVALID"
  | "TRIGGER_METADATA_FORBIDDEN";

export type MonitoringTriggerError = Readonly<{
  code: MonitoringTriggerErrorCode;
  message: string;
  path?: string;
}>;
