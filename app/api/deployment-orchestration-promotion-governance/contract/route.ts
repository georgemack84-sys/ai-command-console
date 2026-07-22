import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDeploymentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeploymentGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load deployment governance contract."); } }
