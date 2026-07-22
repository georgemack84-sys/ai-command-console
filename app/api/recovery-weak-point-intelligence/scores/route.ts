import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecoveryWeakPointUser, scoresRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryWeakPointUser();
    return apiSuccess(await scoresRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate recovery stress scores.");
  }
}
