import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimeAssuranceContractResponse, requireRuntimeAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(getRuntimeAssuranceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Runtime Assurance Engine.");
  }
}
