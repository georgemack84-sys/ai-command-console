import { contractResponse, requireOperationalEvolutionKnowledgeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Operational Evolution Knowledge contract."); } }
