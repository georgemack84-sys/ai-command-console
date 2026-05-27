export const OPERATOR_API_ERRORS = {
  BLOCKED_UNSAFE_OPERATOR_ACTION: "BLOCKED_UNSAFE_OPERATOR_ACTION",
} as const;

export const OPERATOR_API_REASONS = {
  TIMELINE_MISMATCH: "Timeline does not currently explain read model",
  ADVISORY_NOT_OPEN: "Advisory is not open.",
  VERIFICATION_ALREADY_PASSED: "Verification already passed.",
  VERIFICATION_ALREADY_RUNNING: "Verification already running.",
  MISSING_EXECUTION: "Execution could not be loaded safely.",
  MISSING_TIMELINE: "Timeline could not be loaded safely.",
  MISSING_READ_MODEL: "Read model could not be loaded safely.",
  MISSING_ADVISORY: "Advisory is not available.",
} as const;

