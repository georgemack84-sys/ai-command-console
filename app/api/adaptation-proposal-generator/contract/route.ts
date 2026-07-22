import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptationProposalGeneratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationProposalGeneratorUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal generator contract.");
  }
}
