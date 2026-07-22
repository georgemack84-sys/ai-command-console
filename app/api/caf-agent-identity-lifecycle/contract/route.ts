import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAgentIdentityLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF agent identity lifecycle contract."); } }
