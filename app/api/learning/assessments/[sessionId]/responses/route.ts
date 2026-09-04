import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { submitAssessmentResponse } from "@/src/server/learning/assessment-session-service";

const responseSchema = z.object({ item_id: z.string().min(1), answer: z.unknown(), self_rated_confidence: z.number().min(0).max(1).optional() }).refine((value) => Object.hasOwn(value, "answer"), { message: "An answer is required.", path: ["answer"] });

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const { sessionId } = await context.params;
    const body = responseSchema.parse(await request.json());
    const response = await submitAssessmentResponse(user.id, sessionId, { itemId: body.item_id, answer: body.answer, selfRatedConfidence: body.self_rated_confidence });
    return apiSuccess({ response: { item_id: response.itemId, submitted_at: response.submittedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to submit assessment response.");
  }
}
