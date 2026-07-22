import { getTrustAlignmentVerificationBundle, runTrustAlignmentVerification, validateTrustAlignmentVerification } from "@/services/trust-alignment-verification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustAlignmentVerificationInput, TrustAlignmentVerificationResult } from "@/types/trust-alignment-verification";

export async function requireTrustAlignmentVerificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustAlignmentVerificationInput { return body as TrustAlignmentVerificationInput; }
function resultFromBody(body: Record<string, unknown>): TrustAlignmentVerificationResult { return (body.result as TrustAlignmentVerificationResult | undefined) ?? runTrustAlignmentVerification(inputFromBody(body)); }
export function contractResponse() { return getTrustAlignmentVerificationBundle(); }
export async function validateRequest(request: Request) { return validateTrustAlignmentVerification(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { registry: result.registry }; }
export async function frameworksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { constitutional: result.constitutional, mission: result.mission, behavioral: result.behavioral, objective: result.objective }; }
export async function alignmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { alignment: result.alignment, engine: result.engine }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { report: result.report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { continuous: result.continuous, governance: result.governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustAlignmentVerification(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
