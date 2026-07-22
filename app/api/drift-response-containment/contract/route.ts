import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDriftResponseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftResponseUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve drift response contract.");
  }
}
