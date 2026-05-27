type GovernanceEventRecord = Record<string, unknown> & {
  tenantId?: string;
  workspaceId?: string;
};

const governanceEvents: GovernanceEventRecord[] = [];

export function recordGovernanceAudit(event: GovernanceEventRecord) {
  governanceEvents.push({ ...event });
}

export function resetGovernanceAuditEvents() {
  governanceEvents.length = 0;
}

export function getGovernanceAuditEvents(scope?: { tenantId?: string }) {
  return governanceEvents.filter((event) => !scope?.tenantId || String(event.tenantId || "__global__") === scope.tenantId);
}
