import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAdaptiveSafetyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdaptiveSafetyUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect adaptive safety certification."); } }
export async function POST(request: Request) { try { await requireAdaptiveSafetyUser(); return apiSuccess(await inspectRequest(request)); } catch (error) { return apiError(error, "Unable to inspect adaptive safety certification."); } }
