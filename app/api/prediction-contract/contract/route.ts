import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePredictionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePredictionContractUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load prediction contract.");
  }
}
