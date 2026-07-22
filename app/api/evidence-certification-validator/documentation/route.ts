import { apiError, apiSuccess } from "@/src/server/api/response";
import { documentationRequest, requireEvidenceCertificationValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceCertificationValidatorUser();
    return apiSuccess(await documentationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve documentation validation report.");
  }
}
