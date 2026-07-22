import { NextResponse } from "next/server";
import { historyReplayRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await historyReplayRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await historyReplayRequest(request)); }
