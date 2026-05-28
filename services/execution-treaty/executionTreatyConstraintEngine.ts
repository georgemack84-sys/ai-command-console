import type { ExecutorConstraints } from "@/types/execution-treaty";

export const ZERO_TRUST_EXECUTOR_CONSTRAINTS: ExecutorConstraints = {
  mayExecute: false,
  requiresRevalidation: true,
  allowedExecutorModes: ["future-controlled-executor"],
  forbiddenActions: [
    "mutate-plan",
    "infer-missing-fields",
    "upgrade-risk",
    "bypass-approval",
    "replace-registry-snapshot",
    "replace-governance-snapshot",
    "replace-replay-binding",
    "ignore-quarantine",
    "ignore-revalidation",
    "infer-tool-contracts",
    "execute-without-boundary-validation",
  ],
} as const;

export function buildExecutorConstraints(): ExecutorConstraints {
  return ZERO_TRUST_EXECUTOR_CONSTRAINTS;
}
