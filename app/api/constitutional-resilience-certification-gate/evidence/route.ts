import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireConstitutionalCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitutional certification evidence."); }
}
