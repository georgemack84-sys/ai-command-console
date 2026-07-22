import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectHiddenRequest, requireHiddenCommunicationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireHiddenCommunicationUser(); return apiSuccess(await detectHiddenRequest(request)); }
  catch (error) { return apiError(error, "Unable to detect hidden communication."); }
}
