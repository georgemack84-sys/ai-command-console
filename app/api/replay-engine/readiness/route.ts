import { NextResponse } from "next/server";
import { readinessRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await readinessRequest(request)); }
