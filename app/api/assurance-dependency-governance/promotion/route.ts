import { apiError, apiSuccess } from "@/src/server/api/response";
import { promotionRequest, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await promotionRequest()); } catch (error) { return apiError(error, "Unable to load dependency promotion."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await promotionRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency promotion."); } }
