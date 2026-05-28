export type ExecutorConstraints = Readonly<{
  mayExecute: false;
  requiresRevalidation: true;
  allowedExecutorModes: readonly ["future-controlled-executor"];
  forbiddenActions: readonly [
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
  ];
}>;
