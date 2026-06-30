import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeDecisionInfluence,
  buildDecisionInfluenceObservabilitySurface,
  buildInfluenceGraph,
  calculateInfluenceContributions,
  computeDecisionInfluenceHash,
  detectInfluenceConflicts,
  explainDecisionInfluence,
  getDecisionInfluenceContract,
  resolveInfluenceDependencies,
  runDecisionInfluenceAnalysis,
  validateDecisionInfluenceAnalysis,
  verifyInfluenceReplay,
} from "@/services/decision-influence-analysis";
import type { DecisionInfluenceAnalysis, DecisionInfluenceEngineInput } from "@/types/decision-influence-analysis";

export async function requireDecisionInfluenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DecisionInfluenceEngineInput {
  return body as DecisionInfluenceEngineInput;
}

export function getDecisionInfluenceContractResponse() {
  return getDecisionInfluenceContract();
}

export async function analyzeDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  return runDecisionInfluenceAnalysis(inputFromBody(body));
}

export async function graphDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return buildInfluenceGraph(analysis.influences);
}

export async function dependenciesDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return resolveInfluenceDependencies(analysis);
}

export async function conflictsDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return detectInfluenceConflicts(analysis.influences, inputFromBody(body).scenario);
}

export async function contributionsDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return calculateInfluenceContributions(analysis.influences);
}

export async function validateDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as Partial<DecisionInfluenceAnalysis> | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return validateDecisionInfluenceAnalysis(analysis);
}

export async function replayDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return verifyInfluenceReplay(analysis);
}

export async function explainDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return explainDecisionInfluence(analysis);
}

export async function hashDecisionInfluenceRequest(request: Request) {
  const body = await readBody(request);
  const analysis = (body.analysis as DecisionInfluenceAnalysis | undefined) ?? analyzeDecisionInfluence(inputFromBody(body));
  return { decision_influence_hash: computeDecisionInfluenceHash(analysis) };
}

export async function inspectDecisionInfluenceRequest(request?: Request) {
  if (!request) return buildDecisionInfluenceObservabilitySurface();
  const body = await readBody(request);
  return buildDecisionInfluenceObservabilitySurface(inputFromBody(body));
}
