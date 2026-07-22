import { NextResponse } from "next/server";
import { provenanceRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await provenanceRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await provenanceRequest(request)); }
