import { getProvingContinuousProvingRegressionValidationBundle, runProvingContinuousProvingRegressionValidation, validateProvingContinuousProvingRegressionValidation } from "@/services/proving-continuous-proving-regression-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousInput, ContinuousResult } from "@/types/proving-continuous-proving-regression-validation";

export async function requireContinuousProvingUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousInput { return body as ContinuousInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousResult { return (body.result as ContinuousResult | undefined) ?? runProvingContinuousProvingRegressionValidation(inputFromBody(body)); }
export function contractResponse() { return getProvingContinuousProvingRegressionValidationBundle(); }
export async function validateRequest(request: Request) { return validateProvingContinuousProvingRegressionValidation(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { engine: result.engine }; }
export async function triggersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { triggers: result.triggers }; }
export async function impactRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { impact_report: result.impact_report }; }
export async function pipelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { pipeline: result.pipeline }; }
export async function regressionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { regression_report: result.regression_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { qualification: result.qualification }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { decision: result.decision }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { dashboard: result.dashboard }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingContinuousProvingRegressionValidation(); return { gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
