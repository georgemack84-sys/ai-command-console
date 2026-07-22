import { apiError, apiSuccess } from "@/src/server/api/response";
import { proposalRequest, requireAdaptationProposalContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationProposalContractUser();
    return apiSuccess(await proposalRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal.");
  }
}
