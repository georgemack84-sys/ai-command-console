import { NextResponse } from "next/server";
import { replayRequest, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await replayRequest(request)); }
