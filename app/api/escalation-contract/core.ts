import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildEscalationContractRecord,
  buildEscalationObservabilitySurface,
  computeEscalationHash,
  getEscalationContract,
  replayEscalationContract,
  transitionEscalationState,
  validateEscalationContractRecord,
} from "@/services/escalation-contract";
import type { EscalationContractRecord, EscalationState } from "@/types/escalation-contract";

export async function requireEscalationContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getEscalationContractResponse() {
  return getEscalationContract();
}

export async function validateEscalationContractRequest(request: Request) {
  const body = await readBody(request);
  return validateEscalationContractRecord(Object.keys(body).length ? body as Partial<EscalationContractRecord> : buildEscalationContractRecord());
}

export async function hashEscalationContractRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildEscalationContractRecord(body as Partial<EscalationContractRecord>) : buildEscalationContractRecord();
  return { escalation_contract_hash: computeEscalationHash(record) };
}

export async function replayEscalationContractRequest(request: Request) {
  const body = await readBody(request);
  return replayEscalationContract(Object.keys(body).length ? buildEscalationContractRecord(body as Partial<EscalationContractRecord>) : buildEscalationContractRecord());
}

export async function transitionEscalationContractRequest(request: Request) {
  const body = await readBody(request) as { record?: Partial<EscalationContractRecord>; to_state?: EscalationState };
  return transitionEscalationState(buildEscalationContractRecord(body.record ?? {}), body.to_state ?? "PRIORITIZED");
}

export async function inspectEscalationContractRequest(request?: Request) {
  if (!request) return buildEscalationObservabilitySurface();
  const body = await readBody(request);
  return buildEscalationObservabilitySurface(Object.keys(body).length ? buildEscalationContractRecord(body as Partial<EscalationContractRecord>) : buildEscalationContractRecord());
}
