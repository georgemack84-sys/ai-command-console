import { apiError, apiSuccess } from "@/src/server/api/response";
import { collectionRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await collectionRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI collection."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await collectionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI collection."); } }
