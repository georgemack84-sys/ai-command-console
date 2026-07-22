import { apiError, apiSuccess } from "@/src/server/api/response";
import { diagnosticsRequest, requireApplicationOperationalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(await diagnosticsRequest()); } catch (error) { return apiError(error, "Unable to inspect application diagnostics."); } }
export async function POST(request: Request) { try { await requireApplicationOperationalUser(); return apiSuccess(await diagnosticsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application diagnostics."); } }
