import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustDriftUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Trust Drift Detection contract."); } }
