import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to inspect registry audit evidence."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to inspect registry audit evidence."); } }
