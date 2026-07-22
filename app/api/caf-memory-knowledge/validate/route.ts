import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMemoryKnowledgeUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireMemoryKnowledgeUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate CAF memory knowledge."); } }
