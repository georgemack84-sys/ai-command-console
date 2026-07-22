import { NextResponse } from "next/server";
import { requireReplayEngineUser, securityRequest } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await securityRequest(request)); }
