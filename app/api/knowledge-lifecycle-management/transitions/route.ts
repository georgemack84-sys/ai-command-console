import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireKnowledgeLifecycleUser, transitionsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await transitionsRequest()); } catch (error) { return apiError(error, "Unable to retrieve lifecycle transitions."); } }
export async function POST(request: Request) { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await transitionsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve lifecycle transitions."); } }
