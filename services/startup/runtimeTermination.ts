export function buildRuntimeTermination(code: string, message: string) {
  return {
    code,
    message,
    exitCode: 1,
  };
}
