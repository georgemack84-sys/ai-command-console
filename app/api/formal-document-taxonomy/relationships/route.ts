import { apiError, apiSuccess } from "@/src/server/api/response";
import { relationshipsRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await relationshipsRequest()); } catch (error) { return apiError(error, "Unable to retrieve document relationships."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await relationshipsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve document relationships."); } }
