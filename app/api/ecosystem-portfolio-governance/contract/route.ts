import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireEcosystemPortfolioGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireEcosystemPortfolioGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Ecosystem Portfolio Governance contract."); } }
