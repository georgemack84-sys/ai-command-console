import { NextResponse } from "next/server";
import { requireReplayEngineUser, runtimeReplayRequest } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await runtimeReplayRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await runtimeReplayRequest(request)); }
