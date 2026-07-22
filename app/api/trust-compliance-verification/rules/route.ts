import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustComplianceUser, rulesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await rulesRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance rules."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await rulesRequest(request)); } catch (error) { return apiError(error, "Unable to project compliance rules."); } }
