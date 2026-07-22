import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF certification decision."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF certification decision."); } }
