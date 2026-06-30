import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTaskSequencingUser, validateTaskSequencingRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTaskSequencingUser();
    return apiSuccess(await validateTaskSequencingRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate task sequence.");
  }
}
