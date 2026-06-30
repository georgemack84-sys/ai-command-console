import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionContractUser, visibilityExecutionContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionContractUser();
    return apiSuccess(await visibilityExecutionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build execution contract visibility surface.");
  }
}
