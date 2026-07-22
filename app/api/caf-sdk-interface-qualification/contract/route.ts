import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSdkInterfaceQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF SDK interface qualification contract."); } }
