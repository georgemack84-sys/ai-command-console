import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskAdaptationCertificationUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationCertificationUser();
    return apiSuccess(await validationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation certification validation.");
  }
}
