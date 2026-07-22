import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainsRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await domainsRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI domains."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await domainsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI domains."); } }
