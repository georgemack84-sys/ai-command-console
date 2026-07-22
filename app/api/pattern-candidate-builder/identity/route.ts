import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityPatternCandidateRequest, requirePatternCandidateBuilderUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(await identityPatternCandidateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify pattern candidate identity.");
  }
}
