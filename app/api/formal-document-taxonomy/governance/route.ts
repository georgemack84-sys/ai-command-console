import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to retrieve taxonomy governance engine."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve taxonomy governance engine."); } }
