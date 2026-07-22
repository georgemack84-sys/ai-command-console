import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireHiddenCommunicationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireHiddenCommunicationUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate hidden communication detection."); }
}
