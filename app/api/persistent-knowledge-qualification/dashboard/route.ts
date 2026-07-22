import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requirePersistentKnowledgeQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await dashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect persistent knowledge qualification.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to qualify persistent knowledge.");
  }
}
