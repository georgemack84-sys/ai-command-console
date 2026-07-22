import { NextResponse } from "next/server";
import { evidenceRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
