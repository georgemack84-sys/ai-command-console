import { aggregationRequest, requireCertificationDecisionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await aggregationRequest()); } catch (error) { return apiError(error, "Unable to inspect certification aggregation."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await aggregationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification aggregation."); } }
