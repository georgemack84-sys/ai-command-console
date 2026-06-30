import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveRuntimeCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveRuntimeCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load adaptive runtime certification contract.");
  }
}
