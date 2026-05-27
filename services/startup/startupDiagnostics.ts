import { sanitizeStartupError } from "./logSanitizer";

export function buildStartupDiagnostics(error: unknown, context?: Record<string, unknown>) {
  const normalized = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };

  return sanitizeStartupError({
    ...normalized,
    context,
  });
}
