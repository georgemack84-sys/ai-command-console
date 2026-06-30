import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayTaskSequencingRequest, requireTaskSequencingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTaskSequencingUser();
    return apiSuccess(await replayTaskSequencingRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay task sequence.");
  }
}
