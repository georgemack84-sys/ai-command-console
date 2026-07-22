import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGraphsRequest, requireProposalLineageReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLineageReplayUser();
    return apiSuccess(await replayGraphsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal replay graphs.");
  }
}
