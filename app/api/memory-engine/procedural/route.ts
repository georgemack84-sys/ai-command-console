import { NextResponse } from "next/server";
import { proceduralRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await proceduralRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await proceduralRequest(request)); }
