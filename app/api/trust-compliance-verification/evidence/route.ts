import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustComplianceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance evidence."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to project compliance evidence."); } }
