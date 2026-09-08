import { accessCookieName, accessProtectionEnabled, createAccessToken, hasAccess, validPin } from "../../../lib/self-hosted/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json({ protected: accessProtectionEnabled(), authenticated: hasAccess(request.headers.get("cookie")) });
}

export async function POST(request: Request) {
  const { pin } = await request.json() as { pin?: unknown };
  if (!accessProtectionEnabled()) return Response.json({ protected: false, authenticated: true });
  if (!validPin(pin)) return Response.json({ error: "That PIN isn’t correct." }, { status: 401 });
  const token = createAccessToken();
  const response = Response.json({ protected: true, authenticated: true });
  response.headers.append("Set-Cookie", `${accessCookieName}=${token.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token.maxAge}`);
  return response;
}
