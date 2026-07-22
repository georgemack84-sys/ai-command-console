import { analyticsRequest, requireEcosystemPortfolioGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireEcosystemPortfolioGovernanceUser(); return apiSuccess(await analyticsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio analytics."); } }
