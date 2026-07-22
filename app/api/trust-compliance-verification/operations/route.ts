import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requireTrustComplianceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await operationsRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance operations."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to project compliance operations."); } }
