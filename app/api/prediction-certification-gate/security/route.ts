import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePredictionCertificationUser, securityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionCertificationUser();
    return apiSuccess(await securityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load security certification.");
  }
}
