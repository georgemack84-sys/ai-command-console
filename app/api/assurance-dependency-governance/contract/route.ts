import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load assurance dependency governance contract."); } }
