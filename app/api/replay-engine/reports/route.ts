import { NextResponse } from "next/server";
import { reportsRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await reportsRequest(request)); }
