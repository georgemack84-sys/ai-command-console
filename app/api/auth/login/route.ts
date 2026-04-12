import { z } from "zod";
import { authenticateUser, setSessionCookie } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const result = await authenticateUser(body.email, body.password);
    if ("error" in result) {
      throw new AppError(401, "invalid_credentials", result.error || "Invalid email or password.");
    }

    await setSessionCookie(result.user);
    return apiSuccess({ user: result.user });
  } catch (error) {
    return apiError(error, "Unable to log in.");
  }
}
