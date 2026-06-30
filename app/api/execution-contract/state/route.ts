import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionContractUser, stateExecutionContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionContractUser();
    return apiSuccess(await stateExecutionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate execution state.");
  }
}
