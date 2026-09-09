import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { supabaseEnvironment } from "./env";

export async function createServerSupabaseClient(response?: NextResponse) {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnvironment();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response?.cookies.set(name, value, options));
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot write cookies. */ }
      }
    }
  });
}
