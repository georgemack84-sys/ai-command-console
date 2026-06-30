import { apiError, apiSuccess } from "@/src/server/api/response";
import { prioritizeEscalationsRequest, requireEscalationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(await prioritizeEscalationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to prioritize escalations.");
  }
}
