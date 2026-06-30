import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTaskSequencingUser, sequenceTaskSequencingRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTaskSequencingUser();
    return apiSuccess(await sequenceTaskSequencingRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate task sequence.");
  }
}
