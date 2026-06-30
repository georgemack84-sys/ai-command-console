import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeSupervisionContractUser, validateRuntimeSupervisionContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionContractUser();
    return apiSuccess(await validateRuntimeSupervisionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Runtime Supervision Contract.");
  }
}
