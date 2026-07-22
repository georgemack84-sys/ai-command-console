import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConstitutionalCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect constitutional certification gate."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect constitutional certification gate."); }
}
