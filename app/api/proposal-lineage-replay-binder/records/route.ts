import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireProposalLineageReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLineageReplayUser();
    return apiSuccess(await recordsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal lineage records.");
  }
}
