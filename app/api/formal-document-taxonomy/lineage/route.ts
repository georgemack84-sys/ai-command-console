import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to retrieve document lineage registry."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve document lineage registry."); } }
