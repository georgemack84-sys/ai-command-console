import { getAutonomyClassificationFrameworkBundle, runAutonomyClassificationFramework, validateAutonomyClassificationFramework } from "@/services/autonomy-classification-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AutonomyClassificationInput, AutonomyClassificationResult } from "@/types/autonomy-classification-framework";

export async function requireAutonomyClassificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AutonomyClassificationInput { return body as AutonomyClassificationInput; }
function resultFromBody(body: Record<string, unknown>): AutonomyClassificationResult { return (body.result as AutonomyClassificationResult | undefined) ?? runAutonomyClassificationFramework(inputFromBody(body)); }
export function contractResponse() { return getAutonomyClassificationFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateAutonomyClassificationFramework(resultFromBody(await readBody(request))); }
export async function classificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { classification: result.classification }; }
export async function taxonomyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { taxonomy: result.taxonomy, levels: result.levels, authority_classes: result.authority_classes }; }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { eligibility_rules: result.eligibility_rules, eligibility: result.eligibility }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { registry: result.registry, classification_rules: result.classification_rules }; }
export async function authorityMatrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { authority_matrix: result.authority_matrix }; }
export async function pipelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { pipeline: result.pipeline, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAutonomyClassificationFramework(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
