import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectSideChannelRequest, requireHiddenCommunicationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireHiddenCommunicationUser(); return apiSuccess(await detectSideChannelRequest(request)); }
  catch (error) { return apiError(error, "Unable to detect side-channel communication."); }
}
