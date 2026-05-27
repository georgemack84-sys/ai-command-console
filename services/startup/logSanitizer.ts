import { redactConfig } from "./redactConfig";

export function sanitizeStartupError(input: {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}) {
  const safeContext = redactConfig(input.context || {});
  const stack = String(input.stack || "").replace(/(ADMIN_SECRET|DATABASE_URL|API_KEY|JWT_SECRET)=([^\s]+)/gi, "$1=[REDACTED]");
  return {
    ...input,
    context: safeContext,
    stack,
  };
}
