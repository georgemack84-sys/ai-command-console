import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireTrustComplianceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance report."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to project compliance report."); } }
