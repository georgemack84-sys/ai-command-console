import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceVisibilityCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceVisibilityCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve governance visibility certification contract."); } }
