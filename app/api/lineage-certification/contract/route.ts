import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLineageCertificationContractResponse, requireLineageCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireLineageCertificationUser();
    return apiSuccess(getLineageCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve LineageCertification contract.");
  }
}
