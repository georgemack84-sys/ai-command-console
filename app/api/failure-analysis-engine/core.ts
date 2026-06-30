import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeFailure,
  buildFailureAnalysisObservabilitySurface,
  getFailureAnalysisEngineContract,
  replayFailureAnalysis,
  validateFailureAnalysis,
} from "@/services/failure-analysis-engine";
import type { FailureAnalysisInput, FailureAnalysisObject } from "@/types/failure-analysis-engine";

export async function requireFailureAnalysisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): FailureAnalysisInput {
  return body as FailureAnalysisInput;
}

function analysisFromBody(body: Record<string, unknown>): FailureAnalysisObject {
  return (body.analysis as FailureAnalysisObject | undefined) ?? analyzeFailure(inputFromBody(body));
}

export function contractResponse() { return getFailureAnalysisEngineContract(); }
export async function analysisRequest(request: Request) { return analyzeFailure(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateFailureAnalysis(analysisFromBody(await readBody(request))); }
export async function rootCauseRequest(request: Request) {
  const analysis = analysisFromBody(await readBody(request));
  return {
    analysis_id: analysis.analysis_id,
    root_cause: analysis.root_cause,
    contributing_causes: analysis.contributing_causes,
  };
}
export async function dependenciesRequest(request: Request) { return analysisFromBody(await readBody(request)).dependency_graph; }
export async function lineageRequest(request: Request) { return analysisFromBody(await readBody(request)).failure_lineage; }
export async function confidenceRequest(request: Request) { return analysisFromBody(await readBody(request)).confidence; }
export async function candidatesRequest(request: Request) { return analysisFromBody(await readBody(request)).recovery_candidates; }
export async function replayRequest(request: Request) { return replayFailureAnalysis(analysisFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildFailureAnalysisObservabilitySurface();
  return buildFailureAnalysisObservabilitySurface(analysisFromBody(await readBody(request)));
}
