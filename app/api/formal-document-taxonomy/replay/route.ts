import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay document taxonomy."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay document taxonomy."); } }
