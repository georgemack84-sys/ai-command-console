import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalRequest, requirePredictionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionCertificationUser();
    return apiSuccess(await constitutionalRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load constitutional certification.");
  }
}
