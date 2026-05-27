import type { RuntimeEnvironmentValidated } from "./envSchema";

export type RuntimeEnvironment = RuntimeEnvironmentValidated & {
  startupValidatedAt: string;
};

export function createRuntimeEnvironment(
  input: RuntimeEnvironmentValidated,
  startupValidatedAt = new Date().toISOString(),
): RuntimeEnvironment {
  return {
    ...input,
    startupValidatedAt,
  };
}
