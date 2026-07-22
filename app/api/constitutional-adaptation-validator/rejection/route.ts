import { apiError, apiSuccess } from "@/src/server/api/response";
import { rejectionRequest, requireConstitutionalAdaptationValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConstitutionalAdaptationValidatorUser();
    return apiSuccess(await rejectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional rejection decision.");
  }
}
