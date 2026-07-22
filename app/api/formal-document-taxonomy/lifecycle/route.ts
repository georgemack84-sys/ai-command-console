import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to retrieve document lifecycle registry."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve document lifecycle registry."); } }
