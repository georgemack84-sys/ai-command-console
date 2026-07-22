import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Trust Recovery Revocation contract."); } }
