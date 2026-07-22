import { getProductionMonitoringPrimitivesBundle, runProductionMonitoringPrimitives, validateProductionMonitoringPrimitives } from "@/services/production-monitoring-primitives";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionMonitoringInput, ProductionMonitoringResult } from "@/types/production-monitoring-primitives";

export async function requireProductionMonitoringPrimitivesUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionMonitoringInput { return body as ProductionMonitoringInput; }
function resultFromBody(body: Record<string, unknown>): ProductionMonitoringResult { return (body.result as ProductionMonitoringResult | undefined) ?? runProductionMonitoringPrimitives(inputFromBody(body)); }
export function contractResponse() { return getProductionMonitoringPrimitivesBundle(); }
export async function validateRequest(request: Request) { return validateProductionMonitoringPrimitives(resultFromBody(await readBody(request))); }
export async function sourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { sources: result.sources }; }
export async function operationalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { operational: result.operational }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { health: result.health }; }
export async function resourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { resources: result.resources }; }
export async function correlationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { correlation: result.correlation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { evidence: result.evidence }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { contracts: result.contracts }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionMonitoringPrimitives(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
