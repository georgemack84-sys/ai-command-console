import { NextResponse } from "next/server";
import { governanceRequest, requireMemoryEngineUser } from "../core";

export async function GET() { await requireMemoryEngineUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireMemoryEngineUser(); return NextResponse.json(await governanceRequest(request)); }
