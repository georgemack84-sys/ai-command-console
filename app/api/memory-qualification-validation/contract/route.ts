import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMemoryQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMemoryQualificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve memory qualification contract.");
  }
}
