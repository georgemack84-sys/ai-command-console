import { apiError, apiSuccess } from "@/src/server/api/response";
import { comparisonRequest, requireStrategicDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategicDriftUser();
    return apiSuccess(await comparisonRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy comparison.");
  }
}
