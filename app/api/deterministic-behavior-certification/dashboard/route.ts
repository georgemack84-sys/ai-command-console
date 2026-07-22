import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireDeterministicBehaviorUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeterministicBehaviorUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect deterministic behavior certification."); } }
export async function POST(request: Request) { try { await requireDeterministicBehaviorUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to certify deterministic behavior."); } }
