import fs from "node:fs";
import path from "node:path";

import * as runtimePaths from "../runtimePaths.js";
import { STARTUP_ERROR_CODES } from "./startupErrorCodes";

export type ContinuityScopeDescriptor = {
  tenantId: string;
  workspaceId: string;
};

export type ProductionContinuityScope = ContinuityScopeDescriptor & {
  scopeId: string;
  purpose: string;
  requiredInProduction: true;
  failureCode: string;
  readinessImpact: string;
};

export const REQUIRED_PRODUCTION_CONTINUITY_SCOPES: ProductionContinuityScope[] = [
  {
    scopeId: "system/default",
    tenantId: "system",
    workspaceId: "default",
    purpose: "Validate persisted runtime continuity, replay lineage, and restore simulation before production startup.",
    requiredInProduction: true,
    failureCode: STARTUP_ERROR_CODES.STARTUP_CONTINUITY_UNVERIFIED,
    readinessImpact: "blocks production startup",
  },
];

function scopeKey(scope: ContinuityScopeDescriptor) {
  return `${scope.tenantId}/${scope.workspaceId}`;
}

function mergeScopes(scopes: ContinuityScopeDescriptor[], requiredScopes: ContinuityScopeDescriptor[]) {
  const byKey = new Map<string, ContinuityScopeDescriptor>();
  for (const scope of [...requiredScopes, ...scopes]) {
    byKey.set(scopeKey(scope), {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
    });
  }
  return Array.from(byKey.values()).sort((a, b) => a.tenantId.localeCompare(b.tenantId) || a.workspaceId.localeCompare(b.workspaceId));
}

export function listContinuityScopes(
  backupRoot: string = runtimePaths.getAgentsDataPath("continuity"),
  {
    includeProductionRequiredScopes = false,
  }: {
    includeProductionRequiredScopes?: boolean;
  } = {},
): ContinuityScopeDescriptor[] {
  const requiredScopes = includeProductionRequiredScopes ? REQUIRED_PRODUCTION_CONTINUITY_SCOPES : [];
  if (!fs.existsSync(backupRoot)) {
    return mergeScopes([], requiredScopes);
  }
  const scopes: ContinuityScopeDescriptor[] = [];
  for (const tenantEntry of fs.readdirSync(backupRoot, { withFileTypes: true })) {
    if (!tenantEntry.isDirectory()) continue;
    const tenantPath = path.join(backupRoot, tenantEntry.name);
    for (const workspaceEntry of fs.readdirSync(tenantPath, { withFileTypes: true })) {
      if (!workspaceEntry.isDirectory()) continue;
      scopes.push({
        tenantId: tenantEntry.name,
        workspaceId: workspaceEntry.name,
      });
    }
  }
  return mergeScopes(scopes, requiredScopes);
}
