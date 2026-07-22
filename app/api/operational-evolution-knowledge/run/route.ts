import { requireOperationalEvolutionKnowledgeUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Operational Evolution Knowledge."); } }
export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Operational Evolution Knowledge."); } }
