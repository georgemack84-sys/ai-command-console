export function createValidationError(code: string, message: string, details?: Record<string, unknown>) {
  return {
    code,
    message,
    details,
  };
}
