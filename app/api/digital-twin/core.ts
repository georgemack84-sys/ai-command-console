import { getDigitalTwinBundle, runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DigitalTwinInput, DigitalTwinResult } from "@/types/digital-twin";

export async function requireDigitalTwinUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): DigitalTwinInput { return body as DigitalTwinInput; }
function resultFromBody(body: Record<string, unknown>): DigitalTwinResult { return (body.result as DigitalTwinResult | undefined) ?? runDigitalTwin(inputFromBody(body)); }
export function contractResponse() { return getDigitalTwinBundle(); }
export async function validateRequest(request: Request) { return validateDigitalTwin(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { engine: result.engine }; }
export async function projectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { projection: result.projection }; }
export async function synchronizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { synchronization: result.synchronization }; }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { graph: result.graph }; }
export async function snapshotsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { snapshots: result.snapshots }; }
export async function queryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { query: result.query }; }
export async function historicalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { historical: result.historical }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { divergence: result.divergence }; }
export async function visualizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { visualization: result.visualization }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { apis: result.apis }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { reports: result.reports }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDigitalTwin(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
