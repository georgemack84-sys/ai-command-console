import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX governance."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX governance."); } }
