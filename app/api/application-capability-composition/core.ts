import {
  getApplicationCapabilityCompositionBundle,
  runApplicationCapabilityComposition,
  validateApplicationCapabilityComposition,
} from "@/services/application-capability-composition";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationCapabilityCompositionInput, ApplicationCapabilityCompositionResult } from "@/types/application-capability-composition";

export async function requireApplicationCapabilityCompositionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationCapabilityCompositionInput { return body as ApplicationCapabilityCompositionInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationCapabilityCompositionResult { return (body.result as ApplicationCapabilityCompositionResult | undefined) ?? runApplicationCapabilityComposition(inputFromBody(body)); }

export function contractResponse() { return getApplicationCapabilityCompositionBundle(); }
export async function validateRequest(request: Request) { return validateApplicationCapabilityComposition(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { foundation: result.foundation }; }
export async function mappingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { capability_map: result.capability_map }; }
export async function compositionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { composition_graph: result.composition_graph }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { dependency_map: result.dependency_map }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { contract_registry: result.contract_registry }; }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { architecture: result.architecture }; }
export async function validationReportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { validation_report: result.validation_report }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { lineage: result.lineage }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { governance_evidence: result.governance_evidence }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationCapabilityComposition(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
