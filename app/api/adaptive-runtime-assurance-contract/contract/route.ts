import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load adaptive runtime assurance contract.");
  }
}
