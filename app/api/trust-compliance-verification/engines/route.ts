import { apiError, apiSuccess } from "@/src/server/api/response";
import { enginesRequest, requireTrustComplianceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await enginesRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance engines."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await enginesRequest(request)); } catch (error) { return apiError(error, "Unable to project compliance engines."); } }
