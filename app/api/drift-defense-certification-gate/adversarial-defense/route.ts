import { adversarialDefenseRequest, requireDriftDefenseCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await adversarialDefenseRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adversarial defense certification.");
  }
}
