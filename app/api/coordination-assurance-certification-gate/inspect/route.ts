import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireCoordinationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCoordinationCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect coordination assurance certification gate."); }
}
export async function POST(request: Request) {
  try { await requireCoordinationCertificationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect coordination assurance certification gate."); }
}
