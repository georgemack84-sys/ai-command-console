import { apiError, apiSuccess } from "@/src/server/api/response";
import { aggregatePatternCandidateRequest, requirePatternCandidateBuilderUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(await aggregatePatternCandidateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to aggregate pattern candidate history.");
  }
}
