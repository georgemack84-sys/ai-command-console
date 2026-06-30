import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayEscalationContractRequest, requireEscalationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationContractUser();
    return apiSuccess(await replayEscalationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay escalation contract.");
  }
}
