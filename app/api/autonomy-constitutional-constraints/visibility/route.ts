import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalConstraintsUser, visibilityConstitutionalValidationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConstitutionalConstraintsUser();
    return apiSuccess(await visibilityConstitutionalValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional visibility.");
  }
}
