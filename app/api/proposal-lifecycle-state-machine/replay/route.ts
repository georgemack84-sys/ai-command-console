import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireProposalLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLifecycleUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay proposal lifecycle.");
  }
}
