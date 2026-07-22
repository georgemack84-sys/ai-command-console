import { NextResponse } from "next/server";
import { registryRequest, requireOperationalIntelligenceUser } from "../core";

export async function GET() { await requireOperationalIntelligenceUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireOperationalIntelligenceUser(); return NextResponse.json(await registryRequest(request)); }
