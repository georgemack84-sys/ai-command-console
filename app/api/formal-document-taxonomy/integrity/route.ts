import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to validate document integrity."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to validate document integrity."); } }
