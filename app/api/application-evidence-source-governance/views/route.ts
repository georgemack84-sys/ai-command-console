import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationEvidenceUser, viewsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await viewsRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence views."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await viewsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence views."); } }
