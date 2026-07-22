import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceConstitutionalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceConstitutionalUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve governance constitutional certification contract."); } }
