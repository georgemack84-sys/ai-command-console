import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPredictionObservabilitySurface,
  createPrediction,
  getPredictionContract,
  validatePrediction,
  validatePredictionLifecycleTransition,
} from "@/services/prediction-contract";
import type { ForecastLifecycleState, PredictionContractInput, PredictionObject } from "@/types/prediction-contract";

export async function requirePredictionContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PredictionContractInput {
  return body as PredictionContractInput;
}

function predictionFromBody(body: Record<string, unknown>): PredictionObject {
  return (body.prediction as PredictionObject | undefined) ?? createPrediction(inputFromBody(body));
}

export function contractResponse() { return getPredictionContract(); }
export async function predictionRequest(request: Request) { return createPrediction(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validatePrediction(predictionFromBody(await readBody(request))); }
export async function transitionRequest(request: Request) {
  const body = await readBody(request);
  return validatePredictionLifecycleTransition(body.from as ForecastLifecycleState, body.to as ForecastLifecycleState);
}
export async function evidenceRequest(request: Request) { return predictionFromBody(await readBody(request)).evidence; }
export async function governanceRequest(request: Request) {
  const prediction = predictionFromBody(await readBody(request));
  return {
    prediction_id: prediction.prediction_id,
    governance_metadata: prediction.governance_metadata,
    constitutional_metadata: prediction.constitutional_metadata,
    advisory_only: prediction.advisory_only,
    operator_required: prediction.operator_required,
  };
}
export async function replayRequest(request: Request) { return predictionFromBody(await readBody(request)).replay_reference; }
export async function inspectRequest(request?: Request) {
  if (!request) return buildPredictionObservabilitySurface();
  return buildPredictionObservabilitySurface(predictionFromBody(await readBody(request)));
}
