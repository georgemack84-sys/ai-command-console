import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMemoryKnowledgeUser, retrievalRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMemoryKnowledgeUser(); return apiSuccess(await retrievalRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF retrieval services."); } }
export async function POST(request: Request) { try { await requireMemoryKnowledgeUser(); return apiSuccess(await retrievalRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF retrieval services."); } }
