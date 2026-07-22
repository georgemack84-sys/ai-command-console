import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExplainabilityCertificationUser, validateExplanationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityCertificationUser();
    return apiSuccess(await validateExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate explainability certification.");
  }
}
