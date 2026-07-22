import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternCandidateBuilderUser, windowsPatternCandidateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(await windowsPatternCandidateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to manage pattern candidate windows.");
  }
}
