import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternCandidateRequest, requirePatternCandidateBuilderUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(await replayPatternCandidateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern candidate builder.");
  }
}
