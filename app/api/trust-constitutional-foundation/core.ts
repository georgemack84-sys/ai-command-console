import { getTrustConstitutionalFoundationBundle, runTrustConstitutionalFoundation, validateTrustConstitutionalFoundation } from "@/services/trust-constitutional-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustConstitutionalInput, TrustConstitutionalResult } from "@/types/trust-constitutional-foundation";

export async function requireTrustConstitutionalUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustConstitutionalInput { return body as TrustConstitutionalInput; }
function resultFromBody(body: Record<string, unknown>): TrustConstitutionalResult { return (body.result as TrustConstitutionalResult | undefined) ?? runTrustConstitutionalFoundation(inputFromBody(body)); }
export function contractResponse() { return getTrustConstitutionalFoundationBundle(); }
export async function validateRequest(request: Request) { return validateTrustConstitutionalFoundation(resultFromBody(await readBody(request))); }
export async function constitutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { constitution: result.constitution }; }
export async function doctrineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { doctrine: result.doctrine }; }
export async function principlesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { principles: result.principles }; }
export async function invariantsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { invariants: result.invariants }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { governance: result.governance }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { authority: result.authority }; }
export async function terminologyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { terminology: result.terminology }; }
export async function boundariesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { boundaries: result.boundaries, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustConstitutionalFoundation(); return { reference_model: result.reference_model, certification: result.certification, integrity_hash: result.integrity_hash }; }
