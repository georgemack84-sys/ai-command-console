import { NextResponse } from "next/server";
import { executionControlRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await executionControlRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await executionControlRequest(request)); }
