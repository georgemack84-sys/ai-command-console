import { NextResponse } from "next/server";
import { evidenceRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
