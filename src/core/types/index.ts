export type UUID = string;
export type ISODateTime = string;
export type Version = string;

export type SystemStatus = "ACTIVE" | "DISABLED" | "LIMITED";
export type ValidationStatus = "VALID" | "INVALID" | "REJECTED";
export type EventSeverity = "INFO" | "WARN" | "ERROR";
export type PhaseId = "1.0";

export const EDGEBOOK_PHASE_1_0: PhaseId = "1.0";
