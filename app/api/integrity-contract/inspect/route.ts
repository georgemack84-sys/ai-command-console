import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectIntegrityRequest, requireIntegrityContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityContractUser(); return apiSuccess(await inspectIntegrityRequest()); }
  catch (error) { return apiError(error, "Unable to inspect integrity contract."); }
}
export async function POST(request: Request) {
  try { await requireIntegrityContractUser(); return apiSuccess(await inspectIntegrityRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect integrity contract."); }
}
