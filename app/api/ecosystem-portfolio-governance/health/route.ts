import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireEcosystemPortfolioGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireEcosystemPortfolioGovernanceUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio health."); } }
