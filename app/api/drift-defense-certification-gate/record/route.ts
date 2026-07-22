import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordRequest, requireDriftDefenseCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await recordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve certification record.");
  }
}
