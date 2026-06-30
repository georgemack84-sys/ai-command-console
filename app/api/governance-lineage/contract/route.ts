import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceLineageContractResponse, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(getGovernanceLineageContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load governance lineage contract.");
  }
}
