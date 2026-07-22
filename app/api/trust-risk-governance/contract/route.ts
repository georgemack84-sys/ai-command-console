import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Risk Modeling & Governance contract."); } }
