import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireEvidencePoisoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEvidencePoisoningUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence poisoning defense contract.");
  }
}
