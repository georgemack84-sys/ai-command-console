import { getTrustArchitectureAlignmentFoundationBundle, runTrustArchitectureAlignmentFoundation, validateTrustArchitectureAlignmentFoundation } from "@/services/trust-architecture-alignment-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustArchitectureAlignmentInput, TrustArchitectureAlignmentResult } from "@/types/trust-architecture-alignment-foundation";

export async function requireTrustArchitectureAlignmentUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustArchitectureAlignmentInput { return body as TrustArchitectureAlignmentInput; }
function resultFromBody(body: Record<string, unknown>): TrustArchitectureAlignmentResult { return (body.result as TrustArchitectureAlignmentResult | undefined) ?? runTrustArchitectureAlignmentFoundation(inputFromBody(body)); }
export function contractResponse() { return getTrustArchitectureAlignmentFoundationBundle(); }
export async function validateRequest(request: Request) { return validateTrustArchitectureAlignmentFoundation(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { architecture: result.architecture }; }
export async function alignmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { alignment: result.alignment }; }
export async function servicesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { services: result.services }; }
export async function integrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { integration: result.integration }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { governance: result.governance }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { observability: result.observability }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { lifecycle: result.lifecycle }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { dependencies: result.dependencies }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustArchitectureAlignmentFoundation(); return { boundary: result.boundary, certification: result.certification, integrity_hash: result.integrity_hash }; }
