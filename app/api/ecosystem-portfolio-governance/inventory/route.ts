import { apiError, apiSuccess } from "@/src/server/api/response";
import { inventoryRequest, requireEcosystemPortfolioGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireEcosystemPortfolioGovernanceUser(); return apiSuccess(await inventoryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio inventory."); } }
