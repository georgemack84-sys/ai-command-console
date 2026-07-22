import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptationProposalCertificationUser, summaryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationProposalCertificationUser();
    return apiSuccess(await summaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal certification summary.");
  }
}
