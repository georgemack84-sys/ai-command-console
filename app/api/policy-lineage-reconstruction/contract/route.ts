import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPolicyLineageContractResponse, requirePolicyLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(getPolicyLineageContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve PolicyLineageReconstruction contract.");
  }
}
