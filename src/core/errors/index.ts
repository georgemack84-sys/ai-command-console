export type EdgeBookErrorCode =
  | "CONFIG_INVALID"
  | "VALIDATION_FAILED"
  | "UNKNOWN_MODULE"
  | "DISABLED_FEATURE"
  | "PHASE_BOUNDARY_VIOLATION";

export class EdgeBookError extends Error {
  readonly code: EdgeBookErrorCode;
  readonly field?: string;

  constructor(code: EdgeBookErrorCode, message: string, field?: string) {
    super(message);
    this.name = "EdgeBookError";
    this.code = code;
    this.field = field;
  }
}
