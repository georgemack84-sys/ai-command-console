import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildExecutionAssuranceObservabilitySurface,
  buildExecutionAssuranceRecord,
  computeExecutionAssuranceIntegrityHash,
  getExecutionAssuranceContractFramework,
  getExecutionAssuranceVersionPolicy,
  replayExecutionAssuranceRecord,
  validateExecutionAssuranceRecord,
} from "@/services/execution-assurance-contract";
import type { ExecutionAssuranceRecord, ExecutionAssuranceScenario } from "@/types/execution-assurance-contract";

export async function requireExecutionAssuranceContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function recordFromBody(body: Record<string, unknown>) {
  return (body.record as ExecutionAssuranceRecord | undefined) ?? buildExecutionAssuranceRecord({ scenario: body.scenario as ExecutionAssuranceScenario | undefined });
}

export function getExecutionAssuranceContractResponse() {
  return getExecutionAssuranceContractFramework();
}

export async function createExecutionAssuranceRecordRequest(request: Request) {
  const body = await readBody(request);
  return buildExecutionAssuranceRecord({ scenario: body.scenario as ExecutionAssuranceScenario | undefined });
}

export async function validateExecutionAssuranceRecordRequest(request: Request) {
  const body = await readBody(request);
  const record = recordFromBody(body);
  return validateExecutionAssuranceRecord(record, { registry: (body.registry as readonly ExecutionAssuranceRecord[] | undefined) ?? [record] });
}

export async function replayExecutionAssuranceRecordRequest(request: Request) {
  const body = await readBody(request);
  return replayExecutionAssuranceRecord(recordFromBody(body));
}

export async function hashExecutionAssuranceRecordRequest(request: Request) {
  const body = await readBody(request);
  return { execution_assurance_integrity_hash: computeExecutionAssuranceIntegrityHash(recordFromBody(body)) };
}

export function versionExecutionAssuranceContractResponse() {
  return getExecutionAssuranceVersionPolicy();
}

export async function inspectExecutionAssuranceRecordRequest(request?: Request) {
  if (!request) return buildExecutionAssuranceObservabilitySurface();
  const body = await readBody(request);
  return buildExecutionAssuranceObservabilitySurface(recordFromBody(body));
}
