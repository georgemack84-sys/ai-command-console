import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildHistoricalIntelligenceObservabilitySurface,
  getHistoricalIntelligenceEngineContract,
  replayHistoricalIntelligence,
  runHistoricalIntelligence,
  validateHistoricalIntelligence,
} from "@/services/historical-intelligence-engine";
import type { HistoricalIntelligenceInput, HistoricalIntelligenceReport } from "@/types/historical-intelligence-engine";

export async function requireHistoricalIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): HistoricalIntelligenceInput {
  return body as HistoricalIntelligenceInput;
}

function reportFromBody(body: Record<string, unknown>): HistoricalIntelligenceReport {
  return (body.report as HistoricalIntelligenceReport | undefined) ?? runHistoricalIntelligence(inputFromBody(body));
}

export function contractResponse() { return getHistoricalIntelligenceEngineContract(); }
export async function analyzeRequest(request: Request) { return runHistoricalIntelligence(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateHistoricalIntelligence(reportFromBody(await readBody(request))); }
export async function modelsRequest(request: Request) { return reportFromBody(await readBody(request)).prediction_models; }
export async function repositoryRequest(request: Request) { return reportFromBody(await readBody(request)).repository; }
export async function replayRequest(request: Request) { return replayHistoricalIntelligence(reportFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildHistoricalIntelligenceObservabilitySurface();
  return buildHistoricalIntelligenceObservabilitySurface(reportFromBody(await readBody(request)));
}
