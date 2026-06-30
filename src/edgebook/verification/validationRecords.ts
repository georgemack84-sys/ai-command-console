export interface ValidationRecord {
  validation_id: string;
  status: "VALID" | "INVALID" | "LIMITED" | "REJECTED";
  reasons: string[];
  timestamp: string;
}

export function createValidationRecord(
  status: ValidationRecord["status"],
  reasons: string[],
  timestamp: string,
): ValidationRecord {
  return {
    validation_id: `validation_${timestamp}_${status}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    status,
    reasons,
    timestamp,
  };
}
