import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireKnowledgeLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect knowledge lifecycle management."); } }
export async function POST(request: Request) { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run knowledge lifecycle management."); } }
