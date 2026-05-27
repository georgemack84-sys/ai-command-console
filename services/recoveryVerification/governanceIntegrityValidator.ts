export function validateGovernanceIntegrity({
  bundle,
  auditEvents = [],
}: {
  bundle: any;
  auditEvents?: any[];
}) {
  const evidence: string[] = [];
  const requiresApproval = Boolean(bundle?.readModel?.recoveryControl?.requiresApproval);
  const hasApprovalTrail = auditEvents.some((event: Record<string, unknown>) => {
    const payload = ((event.payload || {}) as Record<string, unknown>);
    return String(event.type || "").includes("APPROVED")
      || String(payload.reviewAction || "").toLowerCase() === "approve";
  });

  if (requiresApproval && !bundle?.readModel?.recoveryControl?.latestRequestId) {
    evidence.push("approval:missing_request");
  }
  if (requiresApproval && !hasApprovalTrail && bundle?.readModel?.recoveryControl?.status === "approved") {
    evidence.push("approval:audit_missing");
  }

  return {
    valid: evidence.length === 0,
    evidence,
  };
}
