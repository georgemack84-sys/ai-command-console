import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireMemoryKnowledgeUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMemoryKnowledgeUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF memory evidence."); } }
export async function POST(request: Request) { try { await requireMemoryKnowledgeUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF memory evidence."); } }
