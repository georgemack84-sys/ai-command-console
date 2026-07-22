import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireAgentIdentityLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF agent lineage."); } }
export async function POST(request: Request) { try { await requireAgentIdentityLifecycleUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF agent lineage."); } }
