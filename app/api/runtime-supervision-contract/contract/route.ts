import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimeSupervisionContractResponse, requireRuntimeSupervisionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeSupervisionContractUser();
    return apiSuccess(getRuntimeSupervisionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Runtime Supervision Contract.");
  }
}
