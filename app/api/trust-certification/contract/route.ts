import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Trust Certification contract."); } }
