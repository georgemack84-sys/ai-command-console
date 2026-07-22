import { apiError, apiSuccess } from "@/src/server/api/response";
import { interoperabilityRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await interoperabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect application interoperability."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await interoperabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application interoperability."); } }
