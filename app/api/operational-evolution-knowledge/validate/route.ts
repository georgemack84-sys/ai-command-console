import { requireOperationalEvolutionKnowledgeUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Operational Evolution Knowledge."); } }
