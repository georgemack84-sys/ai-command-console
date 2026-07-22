import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskDriftUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskDriftUser();
    return apiSuccess(await validationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk drift validation.");
  }
}
