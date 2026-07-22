import { NextResponse } from "next/server";
import { requireMemoryEngineUser, semanticRequest } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await semanticRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await semanticRequest(request)); }
