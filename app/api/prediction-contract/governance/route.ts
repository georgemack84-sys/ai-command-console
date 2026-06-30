import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requirePredictionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionContractUser();
    return apiSuccess(await governanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load prediction governance metadata.");
  }
}
