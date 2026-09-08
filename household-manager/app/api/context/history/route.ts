import { selfHostedDb } from "../../../../lib/self-hosted/household-db";
import { requireHouseholdAccess } from "../../../../lib/self-hosted/access";
import { invalidateHouseholdContext } from "../../../../lib/context/context-engine";
import { publishContextInvalidated } from "../../../../lib/context/context-events";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../../lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  if (process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE === "supabase" && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return Response.json({ error: "Sign in to view insight history." }, { status: 401 }); const { data: membership } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle(); if (!membership) return Response.json({ error: "No household is associated with this account yet." }, { status: 403 }); const { data, error } = await supabase.from("context_insight_history").select("id,insight_id,event_type,title,message,related_entities,created_at").eq("household_id", membership.household_id).order("created_at", { ascending: false }).limit(50); if (error) return Response.json({ error: "Unable to load insight history." }, { status: 502 }); return Response.json((data ?? []).map((entry) => ({ id: entry.id, insightId: entry.insight_id, eventType: entry.event_type, title: entry.title, message: entry.message, relatedEntities: entry.related_entities, createdAt: entry.created_at })));
  }
  return Response.json(selfHostedDb.listContextHistory().map((entry) => ({ id: entry.id, insightId: entry.insight_id, eventType: entry.event_type, title: entry.title, message: entry.message, relatedEntities: JSON.parse(entry.related_entities) as string[], createdAt: entry.created_at })));
}

export async function POST(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  const body = await request.json() as { action?: unknown; insightId?: unknown };
  if (body.action !== "dismiss" || typeof body.insightId !== "string" || !/^[a-z0-9:-]+$/i.test(body.insightId)) return Response.json({ error: "A valid insight is required." }, { status: 400 });
  if (process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE === "supabase" && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return Response.json({ error: "Sign in to dismiss an insight." }, { status: 401 }); const { data: membership } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle(); if (!membership) return Response.json({ error: "No household is associated with this account yet." }, { status: 403 }); const { data: generated } = await supabase.from("context_insight_history").select("title,message,related_entities").eq("household_id", membership.household_id).eq("insight_id", body.insightId).eq("event_type", "GENERATED").maybeSingle(); if (!generated) return Response.json({ error: "Insight was not found." }, { status: 404 }); const { error } = await supabase.from("context_insight_history").upsert({ household_id: membership.household_id, insight_id: body.insightId, event_type: "DISMISSED", title: generated.title, message: generated.message, related_entities: generated.related_entities }, { onConflict: "household_id,insight_id,event_type", ignoreDuplicates: true }); if (error) return Response.json({ error: "Unable to dismiss insight." }, { status: 502 }); invalidateHouseholdContext(); publishContextInvalidated(); return Response.json({ dismissed: true });
  }
  selfHostedDb.dismissInsight(body.insightId); invalidateHouseholdContext(); publishContextInvalidated();
  return Response.json({ dismissed: true });
}
