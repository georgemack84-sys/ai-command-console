import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectCertificationContractRequest, requireAutonomyCertificationContractUser, validateCertificationContractRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyCertificationContractUser(); return apiSuccess(await inspectCertificationContractRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Certification Contract."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyCertificationContractUser(); return apiSuccess({ validation: await validateCertificationContractRequest(request), observability: await inspectCertificationContractRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Certification Contract."); }
}
