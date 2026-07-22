import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireAgentIdentityLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF agent lifecycle."); } }
export async function POST(request: Request) { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF agent lifecycle."); } }
