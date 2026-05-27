export function getRequiredRecoveryApproval(action: string) {
  const destructive = ["rollback", "terminate", "reassign", "override", "quarantine"].includes(action);
  return {
    required: destructive,
    level: destructive ? "administrative" : "none",
  };
}
