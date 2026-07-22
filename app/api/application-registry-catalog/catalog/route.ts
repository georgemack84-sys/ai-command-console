import { apiError, apiSuccess } from "@/src/server/api/response";
import { catalogRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await catalogRequest()); } catch (error) { return apiError(error, "Unable to inspect ecosystem application catalog."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await catalogRequest(request)); } catch (error) { return apiError(error, "Unable to inspect ecosystem application catalog."); } }
