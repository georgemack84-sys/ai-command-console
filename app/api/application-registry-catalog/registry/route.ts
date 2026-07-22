import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect application registry."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application registry."); } }
