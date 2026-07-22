import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect interface governance."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect interface governance."); } }
