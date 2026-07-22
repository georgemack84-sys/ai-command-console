import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceAuthorityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance authority defense contract.");
  }
}
