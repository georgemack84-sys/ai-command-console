import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractsRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await contractsRequest()); } catch (error) { return apiError(error, "Unable to inspect integration contracts."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await contractsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect integration contracts."); } }
