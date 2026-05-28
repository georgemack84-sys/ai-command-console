import { STARTUP_ERROR_CODES } from "./startupErrorCodes";
import { formatStartupFailure } from "./startupFailureFormatter";
import { listContinuityScopes, REQUIRED_PRODUCTION_CONTINUITY_SCOPES, type ContinuityScopeDescriptor } from "./continuityReadinessBridge";
import { STARTUP_DEFAULTS } from "./environmentDefaults";

type InjectedScopeState = {
  tenantId: string;
  workspaceId: string;
  latestBackup: null | { manifest: { tenantId: string; workspaceId: string; generatedAt: string; completeness: string } };
  integrity?: { ok: boolean; data?: { ready: boolean; issues: string[]; continuity: { ledgerOrdered: boolean; orphanFree: boolean; replayConsistent: boolean } }; error?: { code: string } };
  restore?: { ok: boolean; data?: { readiness: string; issues: string[] }; error?: { code: string; message: string } };
};

export async function validateStartupContinuity({
  scopes,
  backupRoot,
  includeProductionRequiredScopes = false,
  requiredScopes = includeProductionRequiredScopes ? REQUIRED_PRODUCTION_CONTINUITY_SCOPES : [],
  now = new Date().toISOString(),
}: {
  scopes?: InjectedScopeState[];
  backupRoot?: string;
  includeProductionRequiredScopes?: boolean;
  requiredScopes?: ContinuityScopeDescriptor[];
  now?: string;
} = {}) {
  const startupScopes = scopes || [];
  if (!scopes) {
    for (const descriptor of listContinuityScopes(backupRoot, { includeProductionRequiredScopes })) {
      const tenantContext = {
        tenantId: descriptor.tenantId,
        workspaceId: descriptor.workspaceId,
        source: "system" as const,
        isolationVersion: "3.6G" as const,
      };
      const { loadPersistedSnapshot } = await import("../continuity/snapshotCoordinator");
      const { verifyBackupIntegrity } = await import("../continuity/backupIntegrity");
      const { restoreSimulation } = await import("../continuity/restoreSimulation");
      const latestBackup = loadPersistedSnapshot({ tenantContext });
      if (!latestBackup) {
        startupScopes.push({ ...descriptor, latestBackup: null });
        continue;
      }
      const integrity = await verifyBackupIntegrity({ tenantContext, backup: latestBackup });
      const restore = integrity.ok ? await restoreSimulation({ tenantContext, backup: latestBackup }) : { ok: false, error: { code: STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, message: "restore blocked" } };
      startupScopes.push({
        ...descriptor,
        latestBackup,
        integrity,
        restore,
      });
    }
  }

  const presentScopes = new Set(startupScopes.map((scope) => `${scope.tenantId}/${scope.workspaceId}`));
  const missingRequiredScope = requiredScopes.find((scope) => !presentScopes.has(`${scope.tenantId}/${scope.workspaceId}`));
  if (missingRequiredScope) {
    return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, "Required continuity scope is missing.", missingRequiredScope);
  }

  if (startupScopes.length === 0) {
    return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, "No continuity scopes are available for startup validation.");
  }

  for (const scope of startupScopes) {
    if (!scope.latestBackup) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, "Continuity snapshot is missing.", scope);
    }
    if (
      scope.latestBackup.manifest.tenantId !== scope.tenantId
      || scope.latestBackup.manifest.workspaceId !== scope.workspaceId
    ) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_TENANT_CONTINUITY_MISMATCH, "Tenant continuity alignment failed.", scope);
    }
    if (scope.latestBackup.manifest.completeness !== "complete") {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_SNAPSHOT_INVALID, "Continuity snapshot is incomplete.", scope);
    }
    if (Date.parse(now) - Date.parse(scope.latestBackup.manifest.generatedAt) > STARTUP_DEFAULTS.continuityFreshnessMs) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, "Continuity verification is stale.", scope);
    }
    if (!scope.integrity?.ok) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED, "Integrity verification failed.", scope);
    }
    if (!scope.integrity.data?.continuity.ledgerOrdered) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_LEDGER_CONTINUITY_FAILED, "Ledger continuity failed.", scope);
    }
    if (!scope.integrity.data?.continuity.replayConsistent) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_REPLAY_UNCERTAIN, "Replay continuity is uncertain.", scope);
    }
    if (!scope.restore?.ok) {
      return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_RESTORE_SIMULATION_FAILED, "Restore simulation failed.", scope);
    }
  }

  return {
    ok: true as const,
    scopes: startupScopes.map((scope) => ({ tenantId: scope.tenantId, workspaceId: scope.workspaceId })),
  };
}
