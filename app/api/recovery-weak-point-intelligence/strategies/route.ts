import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecoveryWeakPointUser, strategiesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryWeakPointUser();
    return apiSuccess(await strategiesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build recovery strategies.");
  }
}
