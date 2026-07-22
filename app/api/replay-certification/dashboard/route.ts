import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayCertificationUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect replay certification."); } }
export async function POST(request: Request) { try { await requireReplayCertificationUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to certify replay."); } }
