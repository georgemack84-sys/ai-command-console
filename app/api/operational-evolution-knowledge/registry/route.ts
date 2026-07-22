import { registryRequest, requireOperationalEvolutionKnowledgeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to read Operational Evolution registry."); } }
export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to read Operational Evolution registry."); } }
