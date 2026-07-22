import { apiError, apiSuccess } from "@/src/server/api/response";
import { blockingRequest, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await blockingRequest()); } catch (error) { return apiError(error, "Unable to load dependency blocking."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await blockingRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency blocking."); } }
