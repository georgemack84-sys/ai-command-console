import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireQueryCertificationGateUser, runQueryCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQueryCertificationGateUser(); return apiSuccess(await runQueryCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Query Certification Gate."); }
}
