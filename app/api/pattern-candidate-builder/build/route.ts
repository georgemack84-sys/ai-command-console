import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildPatternCandidateRequest, requirePatternCandidateBuilderUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(await buildPatternCandidateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build pattern candidates.");
  }
}
