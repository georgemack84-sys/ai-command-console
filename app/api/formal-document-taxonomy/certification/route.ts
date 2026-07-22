import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireFormalDocumentTaxonomyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to retrieve document taxonomy certification."); } }
export async function POST(request: Request) { try { await requireFormalDocumentTaxonomyUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve document taxonomy certification."); } }
