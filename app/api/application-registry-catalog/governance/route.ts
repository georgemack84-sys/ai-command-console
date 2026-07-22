import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect catalog governance."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect catalog governance."); } }
