import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireKnowledgeLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve lifecycle observability."); } }
export async function POST(request: Request) { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect lifecycle observability."); } }
