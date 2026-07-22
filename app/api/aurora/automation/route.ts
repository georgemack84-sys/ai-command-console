import { apiError, apiSuccess } from "@/src/server/api/response";
import { automationRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await automationRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora automation."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await automationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora automation."); } }
