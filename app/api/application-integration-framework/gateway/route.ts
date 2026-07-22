import { apiError, apiSuccess } from "@/src/server/api/response";
import { gatewayRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await gatewayRequest()); } catch (error) { return apiError(error, "Unable to inspect application gateway."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await gatewayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application gateway."); } }
