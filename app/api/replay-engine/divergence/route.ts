import { NextResponse } from "next/server";
import { divergenceRequest, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(await divergenceRequest()); }
export async function POST(request: Request) { await requireReplayEngineUser(); return NextResponse.json(await divergenceRequest(request)); }
