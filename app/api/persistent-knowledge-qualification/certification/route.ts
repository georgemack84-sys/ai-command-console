import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requirePersistentKnowledgeQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await certificationRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent knowledge qualification certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await certificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify persistent knowledge qualification.");
  }
}
