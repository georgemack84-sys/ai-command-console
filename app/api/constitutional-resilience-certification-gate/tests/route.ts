import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalCertificationUser, testsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(await testsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional certification tests."); }
}
