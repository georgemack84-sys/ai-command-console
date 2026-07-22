import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to validate document dependencies."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to validate document dependencies."); } }
