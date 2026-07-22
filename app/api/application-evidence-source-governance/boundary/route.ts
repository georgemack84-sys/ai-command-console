import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await boundaryRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence boundary."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await boundaryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence boundary."); } }
