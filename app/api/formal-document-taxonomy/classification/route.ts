import { apiError, apiSuccess } from "@/src/server/api/response";
import { classificationRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await classificationRequest()); } catch (error) { return apiError(error, "Unable to retrieve document classification framework."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await classificationRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve document classification framework."); } }
