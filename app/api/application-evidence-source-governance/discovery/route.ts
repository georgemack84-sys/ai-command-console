import { apiError, apiSuccess } from "@/src/server/api/response";
import { discoveryRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await discoveryRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence discovery."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await discoveryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect evidence discovery."); } }
