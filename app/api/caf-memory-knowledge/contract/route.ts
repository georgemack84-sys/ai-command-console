import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMemoryKnowledgeUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMemoryKnowledgeUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF memory knowledge contract."); } }
