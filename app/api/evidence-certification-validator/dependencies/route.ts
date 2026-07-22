import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireEvidenceCertificationValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceCertificationValidatorUser();
    return apiSuccess(await dependenciesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve certification dependency graph.");
  }
}
