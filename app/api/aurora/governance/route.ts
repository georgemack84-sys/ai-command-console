import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora governance."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora governance."); } }
