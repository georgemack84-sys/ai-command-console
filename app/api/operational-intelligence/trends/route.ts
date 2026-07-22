import { NextResponse } from "next/server";
import { requireOperationalIntelligenceUser, trendsRequest } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await trendsRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await trendsRequest(request)); }
