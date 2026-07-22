import { NextResponse } from "next/server";
import { episodicRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await episodicRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await episodicRequest(request)); }
