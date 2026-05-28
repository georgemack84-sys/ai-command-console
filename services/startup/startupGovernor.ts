import { assertStartupAllowed } from "./failFast";
import { runStartupHealthCheck } from "./startupHealthCheck";

export async function assertRuntimeStartupAllowed(env: Record<string, unknown> = process.env) {
  const result = await runStartupHealthCheck({ env });
  return assertStartupAllowed(result);
}
