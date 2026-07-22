import { getWaveFiveLearningStevnBundle, runWaveFiveLearningStevn, validateWaveFiveLearningStevn } from "@/services/wave-five-learning-stevn";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveLearningStevnInput, WaveFiveLearningStevnResult } from "@/types/wave-five-learning-stevn";

export async function requireWaveFiveLearningStevnUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveLearningStevnInput { return body as WaveFiveLearningStevnInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveLearningStevnResult { return (body.result as WaveFiveLearningStevnResult | undefined) ?? runWaveFiveLearningStevn(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveLearningStevnBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveLearningStevn(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { foundation: result.foundation }; }
export async function registryCurriculumRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { registry_curriculum: result.registry_curriculum }; }
export async function assessmentStudyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { assessment_study: result.assessment_study }; }
export async function progressKnowledgeMissionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { progress_knowledge_mission: result.progress_knowledge_mission }; }
export async function stevnIntegrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { stevn_integration: result.stevn_integration }; }
export async function recommendationsAnalyticsQualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { recommendations_analytics_qualification: result.recommendations_analytics_qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveLearningStevn(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
