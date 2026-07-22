import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect registry catalog certification."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect registry catalog certification."); } }
