import { STARTUP_ERROR_CODES, type StartupErrorCode } from "./startupErrorCodes";

export { STARTUP_ERROR_CODES };

export class EnvironmentValidationError extends Error {
  code: StartupErrorCode;
  details?: Record<string, unknown>;

  constructor(code: StartupErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "EnvironmentValidationError";
    this.code = code;
    this.details = details;
  }
}

export function createEnvironmentError(code: StartupErrorCode, message: string, details?: Record<string, unknown>) {
  return new EnvironmentValidationError(code, `${code}: ${message}`, details);
}
