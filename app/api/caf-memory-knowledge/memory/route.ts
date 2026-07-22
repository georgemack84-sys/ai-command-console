import { apiError, apiSuccess } from "@/src/server/api/response";
import { memoryRequest, requireMemoryKnowledgeUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMemoryKnowledgeUser(); return apiSuccess(await memoryRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF memory architecture."); } }
export async function POST(request: Request) { try { await requireMemoryKnowledgeUser(); return apiSuccess(await memoryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF memory architecture."); } }
