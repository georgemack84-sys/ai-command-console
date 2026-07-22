import {
  buildCoordinationIntegrityObservabilitySurface,
  computeCoordinationHash,
  createCoordinationIntegrityLedger,
  detectTampering,
  generateIntegrityReport,
  getCoordinationIntegrityEngine,
  registerCoordinationArtifact,
  replayCoordinationIntegrity,
  validateCoordinationIntegrity,
  validateReplayReferences,
  verifyHashChain,
} from "@/services/coordination-integrity-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CoordinationIntegrityInput, CoordinationIntegrityLedger } from "@/types/coordination-integrity-engine";

export async function requireCoordinationIntegrityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): CoordinationIntegrityLedger {
  return (body.ledger as CoordinationIntegrityLedger | undefined) ?? createCoordinationIntegrityLedger(body as CoordinationIntegrityInput);
}

export function contractResponse() { return getCoordinationIntegrityEngine(); }
export async function registerArtifactRequest(request: Request) { return registerCoordinationArtifact((await readBody(request)) as CoordinationIntegrityInput); }
export async function computeHashRequest(request: Request) {
  const body = await readBody(request);
  return { artifact_hash: computeCoordinationHash(body.artifact ?? body) };
}
export async function verifyChainRequest(request: Request) { return verifyHashChain(ledgerFromBody(await readBody(request))); }
export async function validateReplayRequest(request: Request) { return validateReplayReferences((await readBody(request)) as CoordinationIntegrityInput); }
export async function detectTamperingRequest(request: Request) { return detectTampering((await readBody(request)) as CoordinationIntegrityInput); }
export async function integrityReportRequest(request: Request) { return generateIntegrityReport((await readBody(request)) as CoordinationIntegrityInput); }
export async function replayRequest(request: Request) { return replayCoordinationIntegrity(ledgerFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateCoordinationIntegrity(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildCoordinationIntegrityObservabilitySurface();
  return buildCoordinationIntegrityObservabilitySurface(ledgerFromBody(await readBody(request)));
}
