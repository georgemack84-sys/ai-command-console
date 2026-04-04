import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/src/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await authenticateUser(body.email, body.password);
  if ("error" in result) {
    return NextResponse.json(result, { status: 401 });
  }

  await setSessionCookie(result.user);
  return NextResponse.json({ user: result.user });
}
