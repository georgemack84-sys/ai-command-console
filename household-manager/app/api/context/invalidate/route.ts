import { invalidateHouseholdContext } from "../../../../lib/context/context-engine";
import { publishContextInvalidated } from "../../../../lib/context/context-events";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../../lib/supabase/env";
import { requireHouseholdAccess } from "../../../../lib/self-hosted/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE === "supabase" && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to refresh household context." }, { status: 401 });
  } else { const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized; }
  invalidateHouseholdContext(); publishContextInvalidated();
  return Response.json({ invalidated: true });
}
