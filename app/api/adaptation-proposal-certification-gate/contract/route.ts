import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptationProposalCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationProposalCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal certification contract.");
  }
}
