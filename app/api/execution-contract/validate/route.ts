import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionContractUser, validateExecutionContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionContractUser();
    return apiSuccess(await validateExecutionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate execution contract.");
  }
}
