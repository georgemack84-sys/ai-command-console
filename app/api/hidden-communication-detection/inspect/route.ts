import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireHiddenCommunicationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireHiddenCommunicationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect hidden communication detection."); }
}
export async function POST(request: Request) {
  try { await requireHiddenCommunicationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect hidden communication detection."); }
}
