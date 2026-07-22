import {
  buildMaturityLedgerEvidenceRepository,
  buildMaturityLedgerObservabilitySurface,
  getMaturityLedgerEvidenceRepositoryBundle,
  getMaturityLedgerIndexes,
  listMaturityLedgerEvidence,
  listMaturityLedgerLineage,
  listMaturityLedgerReplay,
  validateMaturityLedgerEvidenceRepository,
} from "@/services/maturity-ledger-evidence-repository";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MaturityLedgerEvidenceRepository, MaturityLedgerInput } from "@/types/maturity-ledger-evidence-repository";

export async function requireMaturityLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): MaturityLedgerEvidenceRepository {
  return (body.repository as MaturityLedgerEvidenceRepository | undefined) ?? buildMaturityLedgerEvidenceRepository(body as MaturityLedgerInput);
}

export function ledgerBundleResponse() { return getMaturityLedgerEvidenceRepositoryBundle(); }
export async function repositoryRequest(request: Request) { return buildMaturityLedgerEvidenceRepository((await readBody(request)) as MaturityLedgerInput); }
export async function evidenceRequest(request: Request) { return listMaturityLedgerEvidence((await readBody(request)) as MaturityLedgerInput); }
export async function lineageRequest(request: Request) { return listMaturityLedgerLineage((await readBody(request)) as MaturityLedgerInput); }
export async function replayRequest(request: Request) { return listMaturityLedgerReplay((await readBody(request)) as MaturityLedgerInput); }
export async function indexesRequest(request: Request) { return getMaturityLedgerIndexes((await readBody(request)) as MaturityLedgerInput); }
export async function validateRequest(request: Request) { return validateMaturityLedgerEvidenceRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMaturityLedgerObservabilitySurface();
  return buildMaturityLedgerObservabilitySurface(repositoryFromBody(await readBody(request)));
}
