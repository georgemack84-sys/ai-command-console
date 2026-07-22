import { getProvingEcosystemReadinessAssessmentBundle, runProvingEcosystemReadinessAssessment, validateProvingEcosystemReadinessAssessment } from "@/services/proving-ecosystem-readiness-assessment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { EcosystemReadinessInput, EcosystemReadinessResult } from "@/types/proving-ecosystem-readiness-assessment";

export async function requireEcosystemReadinessUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): EcosystemReadinessInput { return body as EcosystemReadinessInput; }
function resultFromBody(body: Record<string, unknown>): EcosystemReadinessResult { return (body.result as EcosystemReadinessResult | undefined) ?? runProvingEcosystemReadinessAssessment(inputFromBody(body)); }
export function contractResponse() { return getProvingEcosystemReadinessAssessmentBundle(); }
export async function validateRequest(request: Request) { return validateProvingEcosystemReadinessAssessment(resultFromBody(await readBody(request))); }
export async function ecosystemRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { ecosystem_assessment: result.ecosystem_assessment }; }
export async function operationalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { operational_report: result.operational_report }; }
export async function deploymentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { deployment_report: result.deployment_report }; }
export async function consumerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { consumer_report: result.consumer_report }; }
export async function maturityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { maturity_assessment: result.maturity_assessment }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { health_report: result.health_report }; }
export async function gapsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { gap_report: result.gap_report }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { recommendations: result.recommendations }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { evidence_package: result.evidence_package }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemReadinessAssessment(); return { decision: result.decision, gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
