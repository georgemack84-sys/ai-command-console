import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireAdaptationProposalCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationProposalCertificationUser();
    return apiSuccess(await matrixRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal certification matrix.");
  }
}
