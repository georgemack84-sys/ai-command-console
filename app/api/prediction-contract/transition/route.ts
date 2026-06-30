import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePredictionContractUser, transitionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionContractUser();
    return apiSuccess(await transitionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate prediction lifecycle transition.");
  }
}
