import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildHealthExplainabilityObservabilitySurface,
  explainMissionHealth,
  getHealthExplainabilityEngineContract,
  replayHealthExplanation,
  validateHealthExplanation,
} from "@/services/health-explainability-engine";
import type { HealthExplainabilityInput, HealthExplanation } from "@/types/health-explainability-engine";

export async function requireHealthExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): HealthExplainabilityInput {
  return body as HealthExplainabilityInput;
}

function explanationFromBody(body: Record<string, unknown>): HealthExplanation {
  return (body.explanation as HealthExplanation | undefined) ?? explainMissionHealth(inputFromBody(body));
}

export function contractResponse() { return getHealthExplainabilityEngineContract(); }
export async function explainRequest(request: Request) { return explainMissionHealth(inputFromBody(await readBody(request))); }
export async function scoreDecompositionRequest(request: Request) { return explanationFromBody(await readBody(request)).score_decomposition; }
export async function attributionRequest(request: Request) { return explanationFromBody(await readBody(request)).contributing_subsystems; }
export async function metricChangesRequest(request: Request) { return explanationFromBody(await readBody(request)).changed_metrics; }
export async function confidenceRequest(request: Request) { return explanationFromBody(await readBody(request)).confidence_assessment; }
export async function trendInfluenceRequest(request: Request) { return explanationFromBody(await readBody(request)).trend_influence; }
export async function evidenceTraceRequest(request: Request) { return explanationFromBody(await readBody(request)).evidence_trace; }
export async function dependencyGraphRequest(request: Request) { return explanationFromBody(await readBody(request)).dependency_graph; }
export async function causalChainRequest(request: Request) { return explanationFromBody(await readBody(request)).causal_chain; }
export async function operatorReportRequest(request: Request) { return explanationFromBody(await readBody(request)).operator_summary; }
export async function replayRequest(request: Request) { return replayHealthExplanation(explanationFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateHealthExplanation(explanationFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildHealthExplainabilityObservabilitySurface();
  return buildHealthExplainabilityObservabilitySurface(explanationFromBody(await readBody(request)));
}
