import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskActualizationUser, summaryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskActualizationUser();
    return apiSuccess(await summaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk actualization summary.");
  }
}
