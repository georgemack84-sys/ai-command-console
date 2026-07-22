import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Alignment Verification contract."); } }
