import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect application lineage."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application lineage."); } }
