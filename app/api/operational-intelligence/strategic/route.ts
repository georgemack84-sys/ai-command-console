import { NextResponse } from "next/server";
import { requireOperationalIntelligenceUser, strategicRequest } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await strategicRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await strategicRequest(request)); }
