export function formatStartupFailure(code: string, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message: `${code}: ${message}`,
      details,
    },
  };
}
