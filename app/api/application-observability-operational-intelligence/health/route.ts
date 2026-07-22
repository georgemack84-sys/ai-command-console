import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireApplicationOperationalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to inspect health intelligence."); } }
export async function POST(request: Request) { try { await requireApplicationOperationalUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to inspect health intelligence."); } }
