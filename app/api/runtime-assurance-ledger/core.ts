import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendRuntimeAssuranceLedger,
  certifyRuntimeAssuranceLedger,
  getRuntimeAssuranceLedgerContract,
  publishRuntimeAssuranceLedger,
  replayRuntimeAssuranceLedger,
  validateRuntimeAssuranceLedger,
} from "@/services/runtime-assurance-ledger";
import type { RuntimeLedgerInput, RuntimeLedgerPackage } from "@/types/runtime-assurance-ledger";

export async function requireRuntimeLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RuntimeLedgerInput {
  return body as RuntimeLedgerInput;
}

function packageFromBody(body: Record<string, unknown>): RuntimeLedgerPackage {
  return (body.package as RuntimeLedgerPackage | undefined) ?? appendRuntimeAssuranceLedger(inputFromBody(body));
}

export function contractResponse() { return getRuntimeAssuranceLedgerContract(); }
export async function appendRequest(request: Request) { return appendRuntimeAssuranceLedger(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRuntimeAssuranceLedger(packageFromBody(await readBody(request))); }
export async function evidenceRequest(request: Request) { return packageFromBody(await readBody(request)).evidence_registry; }
export async function chainRequest(request: Request) { return packageFromBody(await readBody(request)).chain; }
export async function auditRequest(request: Request) { return packageFromBody(await readBody(request)).audit_index; }
export async function replayRequest(request: Request) { return replayRuntimeAssuranceLedger(packageFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyRuntimeAssuranceLedger(packageFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishRuntimeAssuranceLedger();
  return publishRuntimeAssuranceLedger(packageFromBody(await readBody(request)));
}
