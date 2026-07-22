import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskActualizationUser, severityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskActualizationUser();
    return apiSuccess(await severityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk severity actualization.");
  }
}
