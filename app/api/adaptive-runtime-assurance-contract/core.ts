import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveRuntimeAssuranceObservabilitySurface,
  certifyAdaptiveRuntimeAssurance,
  createAdaptiveRuntimeAssurance,
  getAdaptiveRuntimeAssuranceContract,
  replayAdaptiveRuntimeAssurance,
  validateAdaptiveRuntimeAssurance,
} from "@/services/adaptive-runtime-assurance-contract";
import type { AdaptiveRuntimeAssuranceInput, AdaptiveRuntimeAssuranceRecord } from "@/types/adaptive-runtime-assurance-contract";

export async function requireAdaptiveRuntimeAssuranceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AdaptiveRuntimeAssuranceInput {
  return body as AdaptiveRuntimeAssuranceInput;
}

function recordFromBody(body: Record<string, unknown>): AdaptiveRuntimeAssuranceRecord {
  return (body.record as AdaptiveRuntimeAssuranceRecord | undefined) ?? createAdaptiveRuntimeAssurance(inputFromBody(body));
}

export function contractResponse() { return getAdaptiveRuntimeAssuranceContract(); }
export async function assuranceRequest(request: Request) { return createAdaptiveRuntimeAssurance(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAdaptiveRuntimeAssurance(recordFromBody(await readBody(request))); }
export async function monitoringRequest(request: Request) { return recordFromBody(await readBody(request)).runtime_observations; }
export async function evidenceRequest(request: Request) { return recordFromBody(await readBody(request)).evidence; }
export async function replayRequest(request: Request) { return replayAdaptiveRuntimeAssurance(recordFromBody(await readBody(request))); }
export async function governanceRequest(request: Request) {
  const record = recordFromBody(await readBody(request));
  return {
    assurance_id: record.assurance_id,
    governance_status: record.governance_status,
    constitutional_status: record.constitutional_status,
    authority_validation: record.authority_validation,
    tenant_isolated: validateAdaptiveRuntimeAssurance(record).tenant_isolated,
    advisory_only: record.advisory_only && !record.execution_authorized,
  };
}
export async function certifyRequest(request: Request) { return certifyAdaptiveRuntimeAssurance(recordFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAdaptiveRuntimeAssuranceObservabilitySurface();
  return buildAdaptiveRuntimeAssuranceObservabilitySurface(recordFromBody(await readBody(request)));
}
