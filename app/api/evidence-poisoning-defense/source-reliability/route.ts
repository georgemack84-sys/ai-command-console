import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEvidencePoisoningUser, sourceReliabilityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidencePoisoningUser();
    return apiSuccess(await sourceReliabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve source reliability report.");
  }
}
