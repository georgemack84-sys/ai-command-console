import { archiveRequest, requireOperationalEvolutionKnowledgeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await archiveRequest()); } catch (error) { return apiError(error, "Unable to read Operational Evidence archive."); } }
export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await archiveRequest(request)); } catch (error) { return apiError(error, "Unable to read Operational Evidence archive."); } }
