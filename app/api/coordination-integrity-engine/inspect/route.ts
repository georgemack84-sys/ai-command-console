import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireCoordinationIntegrityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCoordinationIntegrityUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect coordination integrity engine."); }
}
export async function POST(request: Request) {
  try { await requireCoordinationIntegrityUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect coordination integrity engine."); }
}
