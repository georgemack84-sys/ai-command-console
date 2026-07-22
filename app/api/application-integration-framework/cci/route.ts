import { apiError, apiSuccess } from "@/src/server/api/response";
import { cciRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await cciRequest()); } catch (error) { return apiError(error, "Unable to inspect CCI integration adapter."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await cciRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CCI integration adapter."); } }
