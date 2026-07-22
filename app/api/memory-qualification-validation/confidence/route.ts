import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMemoryQualificationUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMemoryQualificationUser();
    return apiSuccess(await validationRequest(request, "confidence_validation"));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence validation.");
  }
}
