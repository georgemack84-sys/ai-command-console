import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyGovernanceIntegrityContractRequest, requireGovernanceIntegrityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityContractUser();
    return apiSuccess(await classifyGovernanceIntegrityContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify governance integrity failure.");
  }
}
