import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireRiskActualizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskActualizationUser();
    return apiSuccess(await governanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk governance actualization.");
  }
}
