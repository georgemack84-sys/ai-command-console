import {
  getCapabilityCompositionBundle,
  runCapabilityComposition,
  validateCapabilityComposition,
} from "@/services/caf-capability-composition";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CapabilityCompositionInput, CapabilityCompositionResult } from "@/types/caf-capability-composition";

export async function requireCapabilityCompositionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CapabilityCompositionInput { return body as CapabilityCompositionInput; }
function resultFromBody(body: Record<string, unknown>): CapabilityCompositionResult { return (body.result as CapabilityCompositionResult | undefined) ?? runCapabilityComposition(inputFromBody(body)); }

export function contractResponse() { return getCapabilityCompositionBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); }
export async function validateRequest(request: Request) { return validateCapabilityComposition(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); return { composition_registry: result.composition_registry, composition: result.composition }; }
export async function skillsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); return { skill_registry: result.skill_registry, behavior_library: result.behavior_library }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); return { dependency_graph: result.dependency_graph }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityComposition(); return { composition_evidence: result.composition_evidence, replay_validation: result.replay_validation }; }
