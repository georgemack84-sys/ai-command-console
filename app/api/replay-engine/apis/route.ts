import { NextResponse } from "next/server";
import { apisRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await apisRequest(request)); }
