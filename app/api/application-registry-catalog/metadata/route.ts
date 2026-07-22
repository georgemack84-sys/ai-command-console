import { apiError, apiSuccess } from "@/src/server/api/response";
import { metadataRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await metadataRequest()); } catch (error) { return apiError(error, "Unable to inspect application metadata."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await metadataRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application metadata."); } }
