import { apiError, apiSuccess } from "@/src/server/api/response";
import { interfacesRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await interfacesRequest()); } catch (error) { return apiError(error, "Unable to inspect interface registry."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await interfacesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect interface registry."); } }
