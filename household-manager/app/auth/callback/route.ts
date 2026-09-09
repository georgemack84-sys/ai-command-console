import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createServerSupabaseClient(response);
    await supabase.auth.exchangeCodeForSession(code);
  }
  return response;
}
