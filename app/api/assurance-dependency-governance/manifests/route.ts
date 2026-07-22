import { apiError, apiSuccess } from "@/src/server/api/response";
import { manifestsRequest, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await manifestsRequest()); } catch (error) { return apiError(error, "Unable to load dependency manifests."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await manifestsRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency manifests."); } }
