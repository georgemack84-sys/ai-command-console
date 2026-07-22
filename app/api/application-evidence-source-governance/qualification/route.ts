import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence governance qualification."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence governance qualification."); } }
