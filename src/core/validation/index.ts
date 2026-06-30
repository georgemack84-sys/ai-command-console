import { EDGEBOOK_PHASE_1_0, type ISODateTime, type ValidationStatus, type Version } from "../types";

export interface ValidationResult {
  status: ValidationStatus;
  reason: string;
  field?: string;
  timestamp: ISODateTime;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidTimestamp(value: unknown): value is ISODateTime {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

export function isValidVersion(value: unknown): value is Version {
  return isNonEmptyString(value) && /^\d+(\.\d+)*$/.test(value);
}

export function createValidationResult(input: {
  status: ValidationStatus;
  reason: string;
  field?: string;
  timestamp?: ISODateTime;
}): ValidationResult {
  return {
    status: input.status,
    reason: input.reason,
    field: input.field,
    timestamp: input.timestamp ?? new Date(0).toISOString(),
  };
}

export function assertRequiredField(
  field: string,
  value: unknown,
  timestamp: ISODateTime = new Date(0).toISOString(),
): ValidationResult {
  if (!isDefined(value) || (typeof value === "string" && value.trim() === "")) {
    return createValidationResult({
      status: "REJECTED",
      reason: `${field} is required for EdgeBook Phase ${EDGEBOOK_PHASE_1_0}.`,
      field,
      timestamp,
    });
  }

  return createValidationResult({
    status: "VALID",
    reason: `${field} is present.`,
    field,
    timestamp,
  });
}
