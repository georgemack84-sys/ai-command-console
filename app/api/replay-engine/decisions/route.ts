import { NextResponse } from "next/server";
import { decisionReplayRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await decisionReplayRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await decisionReplayRequest(request)); }
