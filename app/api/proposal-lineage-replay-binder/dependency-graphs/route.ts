import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependencyGraphsRequest, requireProposalLineageReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLineageReplayUser();
    return apiSuccess(await dependencyGraphsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal dependency graphs.");
  }
}
