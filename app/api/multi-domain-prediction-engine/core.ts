import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMultiDomainObservabilitySurface,
  getMultiDomainPredictionEngineContract,
  replayMultiDomainPrediction,
  runMultiDomainPrediction,
  validateMultiDomainPrediction,
} from "@/services/multi-domain-prediction-engine";
import type { MultiDomainInput, MultiDomainRepository } from "@/types/multi-domain-prediction-engine";

export async function requireMultiDomainUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MultiDomainInput {
  return body as MultiDomainInput;
}

function repositoryFromBody(body: Record<string, unknown>): MultiDomainRepository {
  return (body.repository as MultiDomainRepository | undefined) ?? runMultiDomainPrediction(inputFromBody(body));
}

export function contractResponse() { return getMultiDomainPredictionEngineContract(); }
export async function predictRequest(request: Request) { return runMultiDomainPrediction(inputFromBody(await readBody(request))); }
export async function repositoryRequest(request: Request) { return repositoryFromBody(await readBody(request)); }
export async function domainsRequest(request: Request) { return repositoryFromBody(await readBody(request)).domain_health_profiles; }
export async function dependenciesRequest(request: Request) { return repositoryFromBody(await readBody(request)).unified_predictions.flatMap((prediction) => prediction.dependency_graph); }
export async function cascadesRequest(request: Request) { return repositoryFromBody(await readBody(request)).unified_predictions.flatMap((prediction) => prediction.cascade_analysis); }
export async function unifiedPredictionsRequest(request: Request) { return repositoryFromBody(await readBody(request)).unified_predictions; }
export async function explainRequest(request: Request) {
  return repositoryFromBody(await readBody(request)).unified_predictions.map((prediction) => ({
    prediction_id: prediction.prediction_id,
    correlated_domains: prediction.correlated_domains,
    explanation: prediction.explanation,
    recommendations: prediction.recommendations,
    mitigation_options: prediction.mitigation_options,
  }));
}
export async function validateRequest(request: Request) { return validateMultiDomainPrediction(repositoryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) { return replayMultiDomainPrediction(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMultiDomainObservabilitySurface();
  return buildMultiDomainObservabilitySurface(repositoryFromBody(await readBody(request)));
}
