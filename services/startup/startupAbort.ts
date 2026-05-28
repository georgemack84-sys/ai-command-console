import { buildRuntimeTermination } from "./runtimeTermination";

export function abortStartup(code: string, message: string, details?: Record<string, unknown>) {
  const error = new Error(`${code}: ${message}`) as Error & {
    code: string;
    exitCode: number;
    details?: Record<string, unknown>;
  };
  error.code = code;
  error.exitCode = buildRuntimeTermination(code, message).exitCode;
  error.details = details;
  return error;
}
