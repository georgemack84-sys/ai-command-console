import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustArchitectureAlignmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustArchitectureAlignmentUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Architecture Alignment contract."); } }
