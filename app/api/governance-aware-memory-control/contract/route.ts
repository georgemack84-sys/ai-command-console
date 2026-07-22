import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceMemoryControlUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceMemoryControlUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance-aware memory control contract.");
  }
}
