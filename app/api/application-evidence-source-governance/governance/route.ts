import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence governance integration."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence governance integration."); } }
