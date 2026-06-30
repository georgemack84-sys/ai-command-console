import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRuntimeSupervisionContractRequest, requireRuntimeSupervisionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionContractUser();
    return apiSuccess(await createRuntimeSupervisionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Runtime Supervision Contract.");
  }
}
