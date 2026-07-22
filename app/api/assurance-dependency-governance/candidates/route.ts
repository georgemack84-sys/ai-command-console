import { apiError, apiSuccess } from "@/src/server/api/response";
import { candidatesRequest, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await candidatesRequest()); } catch (error) { return apiError(error, "Unable to load dependency candidates."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await candidatesRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency candidates."); } }
