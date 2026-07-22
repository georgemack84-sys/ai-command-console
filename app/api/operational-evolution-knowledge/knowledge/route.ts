import { knowledgeRequest, requireOperationalEvolutionKnowledgeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await knowledgeRequest()); } catch (error) { return apiError(error, "Unable to read Operational Knowledge registry."); } }
export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await knowledgeRequest(request)); } catch (error) { return apiError(error, "Unable to read Operational Knowledge registry."); } }
