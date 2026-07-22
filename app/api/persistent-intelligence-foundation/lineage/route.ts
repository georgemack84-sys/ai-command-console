import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requirePersistentIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await lineageRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent intelligence lineage.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await lineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay persistent intelligence lineage.");
  }
}
