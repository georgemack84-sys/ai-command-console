import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProposalValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireProposalValidationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal validation contract.");
  }
}
