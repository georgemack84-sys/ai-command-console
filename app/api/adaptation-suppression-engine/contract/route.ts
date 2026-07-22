import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptationSuppressionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationSuppressionUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation suppression contract.");
  }
}
