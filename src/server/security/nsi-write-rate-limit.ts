import { createHash } from "node:crypto";
import { enforceDistributedRateLimit } from "@/src/server/security/distributed-rate-limit";
import { requireSameOriginMutation } from "@/src/server/security/same-origin";
import {
  getClientIp,
  getDefaultWindowMs,
  getNsiCanonicalAdmissionRateLimit,
  getNsiFetchRateLimit,
  getNsiWriteRateLimit,
} from "@/src/server/security/rate-limit";

export type NsiWriteOperation = "write" | "fetch-dispatch" | "canonical-admission";

type NsiWriteScope = {
  operation: NsiWriteOperation;
  userId: string;
  workspaceId: string;
};

function limitFor(operation: NsiWriteOperation) {
  if (operation === "fetch-dispatch") return getNsiFetchRateLimit();
  if (operation === "canonical-admission") return getNsiCanonicalAdmissionRateLimit();
  return getNsiWriteRateLimit();
}

function clientIpKey(request: Request) {
  return createHash("sha256").update(getClientIp(request)).digest("hex").slice(0, 32);
}

/**
 * Enforces independent actor, workspace, and client-network budgets for every
 * NSI mutation. The network key is hashed before it reaches Redis.
 */
export async function enforceNsiWriteRateLimit(request: Request, scope: NsiWriteScope) {
  requireSameOriginMutation(request);
  const options = { limit: limitFor(scope.operation), windowMs: getDefaultWindowMs() };
  const prefix = `nsi:${scope.operation}`;
  for (const key of [
    `${prefix}:actor:${scope.userId}`,
    `${prefix}:workspace:${scope.workspaceId}`,
    `${prefix}:ip:${clientIpKey(request)}`,
  ]) {
    await enforceDistributedRateLimit(key, options);
  }
}
