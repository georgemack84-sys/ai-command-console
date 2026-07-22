import { getProvingArchitectureEnvironmentFoundationBundle, runProvingArchitectureEnvironmentFoundation, validateProvingArchitectureEnvironmentFoundation } from "@/services/proving-architecture-environment-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProvingFoundationInput, ProvingFoundationResult } from "@/types/proving-architecture-environment-foundation";

export async function requireProvingFoundationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProvingFoundationInput { return body as ProvingFoundationInput; }
function resultFromBody(body: Record<string, unknown>): ProvingFoundationResult { return (body.result as ProvingFoundationResult | undefined) ?? runProvingArchitectureEnvironmentFoundation(inputFromBody(body)); }
export function contractResponse() { return getProvingArchitectureEnvironmentFoundationBundle(); }
export async function validateRequest(request: Request) { return validateProvingArchitectureEnvironmentFoundation(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { architecture: result.architecture, dependencies: result.dependencies }; }
export async function environmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { environment_model: result.environment_model }; }
export async function servicesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { service_catalog: result.service_catalog }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { execution_model: result.execution_model }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { lifecycle: result.lifecycle }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { isolation: result.isolation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { governance: result.governance }; }
export async function gatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { gates: result.gates, invariants: result.invariants }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { registry_schema: result.service_catalog.registry_schema, environment_id: result.environment_model.environment_id, lifecycle_state: result.environment_model.lifecycle_state, services: result.environment_model.services }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingArchitectureEnvironmentFoundation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
