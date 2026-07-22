import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect specification governance framework."); } }
