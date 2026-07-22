import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect formal document taxonomy."); } }
