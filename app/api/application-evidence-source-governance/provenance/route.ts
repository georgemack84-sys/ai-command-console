import { apiError, apiSuccess } from "@/src/server/api/response";
import { provenanceRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await provenanceRequest()); } catch (error) { return apiError(error, "Unable to inspect provenance view."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await provenanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect provenance view."); } }
