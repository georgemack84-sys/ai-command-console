import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve institutional memory contract.");
  }
}
