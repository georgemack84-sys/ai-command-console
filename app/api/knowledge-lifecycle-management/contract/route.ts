import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireKnowledgeLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve knowledge lifecycle contract."); } }
