import { buildInstitutionalMemoryEngine, getInstitutionalMemoryContract, validateInstitutionalMemoryEngine } from "@/services/institutional-memory-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { InstitutionalMemoryInput, InstitutionalMemoryResult } from "@/types/institutional-memory-engine";

export async function requireInstitutionalMemoryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): InstitutionalMemoryInput {
  return body as InstitutionalMemoryInput;
}

function resultFromBody(body: Record<string, unknown>): InstitutionalMemoryResult {
  return (body.result as InstitutionalMemoryResult | undefined) ?? buildInstitutionalMemoryEngine(inputFromBody(body));
}

export function contractResponse() {
  return getInstitutionalMemoryContract();
}

export async function dashboardRequest(request?: Request) {
  if (!request) return buildInstitutionalMemoryEngine();
  return buildInstitutionalMemoryEngine(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateInstitutionalMemoryEngine(resultFromBody(await readBody(request)));
}

export async function repositoriesRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildInstitutionalMemoryEngine();
  return { records: result.records, repositories: result.repositories, certification: result.certification };
}

export async function lineageRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildInstitutionalMemoryEngine();
  return { lineage: result.lineage, versions: result.versions, replay: result.replay, replay_hash: result.replay_hash };
}

export async function ledgerRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildInstitutionalMemoryEngine();
  return { ledger: result.ledger, certification: result.certification, integrity_hash: result.integrity_hash };
}

export async function observabilityRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildInstitutionalMemoryEngine();
  return { status: result.certification.status, available_for_reuse: result.certification.available_for_reuse, observability: result.observability, integrity_hash: result.integrity_hash };
}
