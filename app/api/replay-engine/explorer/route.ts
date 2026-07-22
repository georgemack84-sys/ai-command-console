import { NextResponse } from "next/server";
import { explorerRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await explorerRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await explorerRequest(request)); }
