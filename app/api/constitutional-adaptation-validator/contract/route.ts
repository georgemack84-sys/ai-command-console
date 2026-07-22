import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConstitutionalAdaptationValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConstitutionalAdaptationValidatorUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional adaptation validator contract.");
  }
}
