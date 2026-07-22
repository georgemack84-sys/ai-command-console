import { NextResponse } from "next/server";
import { insightsRequest, requireOperationalIntelligenceUser } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await insightsRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await insightsRequest(request)); }
