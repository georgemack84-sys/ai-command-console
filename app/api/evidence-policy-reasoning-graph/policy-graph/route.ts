import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyGraphRequest, requireReasoningGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(await policyGraphRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build policy influence graph.");
  }
}
