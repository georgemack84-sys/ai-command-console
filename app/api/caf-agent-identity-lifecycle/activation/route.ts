import { apiError, apiSuccess } from "@/src/server/api/response";
import { activationRequest, requireAgentIdentityLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await activationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF agent activation governance."); } }
export async function POST(request: Request) { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await activationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF agent activation governance."); } }
