import { apiError, apiSuccess } from "@/src/server/api/response";
import { referencesRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await referencesRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence references."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await referencesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence references."); } }
