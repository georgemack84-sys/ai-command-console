import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireEcosystemPortfolioGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireEcosystemPortfolioGovernanceUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect ecosystem governance reports."); } }
