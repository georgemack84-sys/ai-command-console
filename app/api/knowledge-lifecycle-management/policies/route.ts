import { apiError, apiSuccess } from "@/src/server/api/response";
import { policiesRequest, requireKnowledgeLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await policiesRequest()); } catch (error) { return apiError(error, "Unable to retrieve lifecycle policies."); } }
export async function POST(request: Request) { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await policiesRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve lifecycle policies."); } }
