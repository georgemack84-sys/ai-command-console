import { getSimulationBundle, runSimulation, validateSimulation } from "@/services/simulation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SimulationInput, SimulationResult } from "@/types/simulation";

export async function requireSimulationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SimulationInput { return body as SimulationInput; }
function resultFromBody(body: Record<string, unknown>): SimulationResult { return (body.result as SimulationResult | undefined) ?? runSimulation(inputFromBody(body)); }
export function contractResponse() { return getSimulationBundle(); }
export async function validateRequest(request: Request) { return validateSimulation(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { engine: result.engine }; }
export async function missionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { mission: result.mission }; }
export async function forecastingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { forecasting: result.forecasting }; }
export async function impactRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { impact: result.impact }; }
export async function resourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { resources: result.resources }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { risk: result.risk }; }
export async function scenariosRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { scenarios: result.scenarios }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { analytics: result.analytics }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { evidence: result.evidence }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { reports: result.reports }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSimulation(); return { apis: result.apis }; }
