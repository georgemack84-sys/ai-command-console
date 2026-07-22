import { getProvingSyntheticDataDigitalTwinGenerationBundle, runProvingSyntheticDataDigitalTwinGeneration, validateProvingSyntheticDataDigitalTwinGeneration } from "@/services/proving-synthetic-data-digital-twin-generation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SyntheticGenerationInput, SyntheticGenerationResult } from "@/types/proving-synthetic-data-digital-twin-generation";

export async function requireSyntheticGenerationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SyntheticGenerationInput { return body as SyntheticGenerationInput; }
function resultFromBody(body: Record<string, unknown>): SyntheticGenerationResult { return (body.result as SyntheticGenerationResult | undefined) ?? runProvingSyntheticDataDigitalTwinGeneration(inputFromBody(body)); }
export function contractResponse() { return getProvingSyntheticDataDigitalTwinGenerationBundle(); }
export async function validateRequest(request: Request) { return validateProvingSyntheticDataDigitalTwinGeneration(resultFromBody(await readBody(request))); }
export async function tenantsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { tenant: result.tenant }; }
export async function organizationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { organization: result.organization }; }
export async function usersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { users: result.users }; }
export async function missionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { missions: result.missions }; }
export async function datasetsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { datasets: result.datasets }; }
export async function twinsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { digital_twins: result.digital_twins }; }
export async function infrastructureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { infrastructure_twin: result.infrastructure_twin }; }
export async function behaviorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { behavior: result.behavior }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { timeline: result.timeline }; }
export async function composeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { composition: result.composition, pipeline: result.pipeline }; }
export async function catalogRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { datasets: result.datasets, digital_twins: result.digital_twins, composition: result.composition }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSyntheticDataDigitalTwinGeneration(); return { readiness: result.readiness, validation: result.validation, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
