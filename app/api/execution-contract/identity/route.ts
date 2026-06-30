import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityExecutionContractRequest, requireExecutionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionContractUser();
    return apiSuccess(await identityExecutionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate execution identity.");
  }
}
