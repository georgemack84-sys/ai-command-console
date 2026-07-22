import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptivePipelineObservability,
  certifyAdaptivePipeline,
  getAdaptivePipelineContract,
  validateAdaptivePipelineCertification,
} from "@/services/adaptive-pipeline-certification";
import type { AdaptivePipelineInput, AdaptivePipelineResult } from "@/types/adaptive-pipeline-certification";

export async function requireAdaptivePipelineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptivePipelineInput { return body as AdaptivePipelineInput; }
function resultFromBody(body: Record<string, unknown>): AdaptivePipelineResult { return (body.result as AdaptivePipelineResult | undefined) ?? certifyAdaptivePipeline(inputFromBody(body)); }
export function contractResponse() { return getAdaptivePipelineContract(); }
export async function dashboardRequest(request: Request) { return certifyAdaptivePipeline(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAdaptivePipelineCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "integration_validation" | "lineage_validation" | "readiness_validation" | "certification_report" | "adaptive_integration_report") { return resultFromBody(await readBody(request))[key]; }
export async function subsystemRequest(request: Request) { return resultFromBody(await readBody(request)).record.subsystem_results; }
export async function inspectRequest(request?: Request) { if (!request) return buildAdaptivePipelineObservability(); return buildAdaptivePipelineObservability(resultFromBody(await readBody(request))); }
