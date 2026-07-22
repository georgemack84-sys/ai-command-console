import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptationProposalContractUser, schemaResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationProposalContractUser();
    return apiSuccess(schemaResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal schema.");
  }
}
