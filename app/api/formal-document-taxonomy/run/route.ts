import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFormalDocumentTaxonomyUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run formal document taxonomy."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run formal document taxonomy."); } }
